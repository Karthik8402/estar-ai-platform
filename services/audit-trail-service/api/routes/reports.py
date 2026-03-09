"""Report endpoints — list, view, and generate (with Gemini AI)."""

import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from db.database import get_db
from db.models import AuditReport, AuditAnomaly, IntegrityCheck, IntegrityViolation

router = APIRouter()
logger = logging.getLogger("audit-trail-service")


@router.get("/reports/summary")
def get_reports(db: Session = Depends(get_db)):
    """Returns list of all generated reports for the ReportViewer table."""
    try:
        reports = db.query(AuditReport).order_by(AuditReport.generated_at.desc()).all()

        return [
            {
                "report_id": r.report_id,
                "report_type": r.report_type,
                "generated_at": r.generated_at.isoformat() + "Z" if r.generated_at else None,
                "compliance_score": r.compliance_score,
                "anomaly_count": r.anomaly_count,
                "summary_text": r.summary_text,
            }
            for r in reports
        ]

    except Exception as e:
        logger.error(f"[/reports/summary] Database query failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch reports: {str(e)}")


@router.post("/reports/generate")
async def generate_report(db: Session = Depends(get_db), report_type: str = "on-demand"):
    """Generate a new compliance report using Gemini AI.

    Collects current anomalies, integrity data, and agent status,
    then prompts Gemini to generate a detailed narrative compliance summary.
    """
    from collections import Counter

    # ── Gather comprehensive data from the database ──────────────────
    total_anomalies = db.query(func.count(AuditAnomaly.id)).scalar() or 0
    all_anomalies = (
        db.query(AuditAnomaly)
        .order_by(AuditAnomaly.timestamp.desc())
        .all()
    )
    recent_anomalies = all_anomalies[:15]  # Top 15 for the prompt
    violations = db.query(IntegrityViolation).all()
    checks = db.query(IntegrityCheck).all()

    passed_checks = sum(1 for c in checks if c.passed)
    failed_checks = sum(1 for c in checks if not c.passed)
    total_checks = len(checks) or 1
    compliance_score = int((passed_checks / total_checks) * 100)

    # ── Build detailed breakdowns ────────────────────────────────────
    severity_counts = Counter(a.severity for a in all_anomalies)
    type_counts = Counter(a.anomaly_type for a in all_anomalies)
    user_counts = Counter(a.user for a in all_anomalies if a.user)
    
    # Identify highest-risk anomalies
    critical_anomalies = [a for a in all_anomalies if a.severity == "critical"]
    error_anomalies = [a for a in all_anomalies if a.severity == "error"]
    high_risk = sorted(all_anomalies, key=lambda a: a.risk_score or 0, reverse=True)[:5]

    severity_breakdown = "\n".join([
        f"  - {sev.upper()}: {count} events"
        for sev, count in severity_counts.most_common()
    ])

    type_breakdown = "\n".join([
        f"  - {t}: {count} events"
        for t, count in type_counts.most_common()
    ])

    user_breakdown = "\n".join([
        f"  - {user}: {count} anomalies flagged"
        for user, count in user_counts.most_common()
    ])

    anomaly_details = "\n".join([
        f"  - [{a.severity.upper()}] Event {a.event_id}: {a.message} (user: {a.user}, risk: {a.risk_score}, confidence: {a.ai_confidence})"
        for a in recent_anomalies
    ])

    high_risk_details = "\n".join([
        f"  - Event {a.event_id}: risk={a.risk_score}, type={a.anomaly_type}, user={a.user} — {a.message}"
        for a in high_risk
    ])

    violation_details = "\n".join([
        f"  - [{v.severity.upper()}] {v.violation_type}: {v.message} (user: {v.user or 'system'}, action: {v.action or 'N/A'}, time: {v.timestamp.strftime('%Y-%m-%d %H:%M') if v.timestamp else 'N/A'})"
        for v in violations
    ]) or "  - No integrity violations recorded."

    check_details = "\n".join([
        f"  - {c.check_name}: {'✓ PASSED' if c.passed else '✗ FAILED'} — {c.detail}"
        for c in checks
    ])

    now_str = datetime.now(timezone.utc).strftime("%B %d, %Y at %H:%M UTC")

    prompt = f"""You are a senior pharmaceutical compliance auditor writing an official audit report for the eSTAR (Electronic Stability Testing and Reporting) AI Platform. This is a {report_type} compliance report generated on {now_str}.

Generate a detailed, professional, regulatory-ready compliance report using ALL of the following data. Do NOT omit any data points. Reference specific event IDs, usernames, risk scores, and timestamps in your analysis.

═══════════════════════════════════════════════════
SYSTEM OVERVIEW
═══════════════════════════════════════════════════
- Report Type: {report_type.upper()}
- Report Date: {now_str}
- Total Anomalies Detected: {total_anomalies}
- Overall Compliance Score: {compliance_score}%
- Integrity Checks Performed: {total_checks}
- Checks Passed: {passed_checks} | Checks Failed: {failed_checks}
- Total Integrity Violations: {len(violations)}
- Critical Anomalies: {len(critical_anomalies)}
- Error-Level Anomalies: {len(error_anomalies)}

═══════════════════════════════════════════════════
SEVERITY DISTRIBUTION
═══════════════════════════════════════════════════
{severity_breakdown}

═══════════════════════════════════════════════════
ANOMALY TYPE DISTRIBUTION
═══════════════════════════════════════════════════
{type_breakdown}

═══════════════════════════════════════════════════
USER RISK PROFILE
═══════════════════════════════════════════════════
{user_breakdown}

═══════════════════════════════════════════════════
TOP 5 HIGHEST-RISK EVENTS
═══════════════════════════════════════════════════
{high_risk_details}

═══════════════════════════════════════════════════
RECENT ANOMALY LOG (Last 15 Events)
═══════════════════════════════════════════════════
{anomaly_details}

═══════════════════════════════════════════════════
INTEGRITY VIOLATIONS
═══════════════════════════════════════════════════
{violation_details}

═══════════════════════════════════════════════════
INTEGRITY CHECK RESULTS
═══════════════════════════════════════════════════
{check_details}

═══════════════════════════════════════════════════
REPORT REQUIREMENTS
═══════════════════════════════════════════════════
Write the report with these MANDATORY sections (use ALL-CAPS headers):

1. EXECUTIVE SUMMARY — 2-3 sentences summarizing overall compliance posture with the exact score and total anomaly count.

2. CRITICAL FINDINGS — Detail EVERY critical and error-level anomaly with specific event IDs, usernames, risk scores, and what regulation they violate. Reference 21 CFR Part 11 sections (e.g., 11.10(a), 11.10(b), 11.10(d), 11.10(e)).

3. ANOMALY ANALYSIS — Break down the anomalies by type and severity. Include the exact counts. Identify patterns (e.g., which users have the most anomalies, what times anomalies occur).

4. INTEGRITY ASSESSMENT — Report on each integrity check (passed/failed) with specific details. Analyze the violations.

5. USER RISK ASSESSMENT — List each user and their risk profile based on the anomaly data.

6. RECOMMENDATIONS — Provide 5-7 specific, actionable recommendations with priority levels (IMMEDIATE / SHORT-TERM / LONG-TERM).

FORMATTING RULES:
- Use plain text only, NO markdown at all (no **, ##, etc.)
- Use ALL-CAPS for section headers
- Use bullet points with the • character
- Include specific numbers, event IDs, and usernames throughout
- Write at least 600 words
- Use professional pharmaceutical regulatory language"""

    system_instruction = (
        "You are a senior pharmaceutical compliance auditor with 15 years of experience in "
        "21 CFR Part 11 compliance. You write detailed, data-driven audit reports that reference "
        "specific events, users, and risk scores. Your reports are used by regulatory inspectors "
        "and must be precise and thorough. Never use markdown formatting."
    )

    # Try Gemini AI, fall back to template if API key missing
    try:
        from shared_ai.factory import get_ai_provider
        ai = get_ai_provider()
        summary_text = await ai.generate_text(
            prompt=prompt,
            system_instruction=system_instruction,
            temperature=0.3,
            max_tokens=4000,
        )
    except Exception as e:
        print(f"❌ AI Report Generation Failed: {e}")
        # Fallback: generate a template report without AI
        summary_text = _generate_fallback_report(
            total_anomalies, compliance_score, recent_anomalies, violations
        )

    # Count existing reports for ID generation
    try:
        report_count = db.query(func.count(AuditReport.id)).scalar() or 0
        new_id = f"rpt_{str(report_count + 1).zfill(3)}"

        report = AuditReport(
            report_id=new_id,
            report_type=report_type,
            generated_at=datetime.now(timezone.utc),
            compliance_score=compliance_score,
            anomaly_count=total_anomalies,
            summary_text=summary_text,
        )
        db.add(report)
        db.commit()
        db.refresh(report)

        return {
            "report_id": report.report_id,
            "report_type": report.report_type,
            "generated_at": report.generated_at.isoformat() + "Z",
            "compliance_score": report.compliance_score,
            "anomaly_count": report.anomaly_count,
            "summary_text": report.summary_text,
        }

    except Exception as e:
        db.rollback()
        logger.error(f"[/reports/generate] Failed to save report: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to save generated report: {str(e)}")


def _generate_fallback_report(
    total_anomalies: int,
    compliance_score: int,
    recent_anomalies: list,
    violations: list,
) -> str:
    """Fallback report when AI provider is unavailable."""
    now = datetime.now(timezone.utc).strftime("%B %d, %Y")

    anomaly_items = "\n".join([
        f"• {a.severity.upper()}: {a.message}"
        for a in recent_anomalies[:5]
    ])

    violation_items = "\n".join([
        f"• {v.message}"
        for v in violations
    ])

    return f"""On-demand compliance report generated on {now}. The audit trail system is currently operating with a compliance score of {compliance_score}%.

CRITICAL FINDINGS

{violation_items if violation_items else "• No critical violations detected during this period."}

OPERATIONAL SUMMARY

• Total anomalies detected: {total_anomalies}
• Overall compliance score: {compliance_score}%
• Report generated without AI analysis (Gemini API key not configured)

RECENT ANOMALIES

{anomaly_items if anomaly_items else "• No recent anomalies."}

RECOMMENDATIONS

• Review any flagged anomalies in the Anomalies section of the dashboard
• Ensure all critical actions have associated electronic signatures
• Configure GEMINI_API_KEY in .env for AI-powered report generation"""
