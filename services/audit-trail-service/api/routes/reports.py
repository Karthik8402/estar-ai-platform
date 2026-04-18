"""Report endpoints — list, view, and generate (with Gemini AI)."""

import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from db.database import get_db
from db.models import AuditReport, AuditAnomaly, IntegrityCheck, IntegrityViolation

router = APIRouter()
logger = logging.getLogger("audit-trail-service")


def _is_complete_report(text: str | None) -> bool:
    if not text:
        return False

    trimmed = text.strip()
    return len(trimmed) > 100


@router.api_route("/reports/summary", methods=["GET", "HEAD"])
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
        raise HTTPException(status_code=500, detail="Failed to fetch reports.")


@router.post("/reports/generate")
async def generate_report(
    db: Session = Depends(get_db),
    report_type: str = Query(default="on-demand", min_length=1, max_length=20, pattern=r"^[a-z][a-z0-9-]*$"),
):
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
Write a clear, concise report with these MANDATORY sections (use ALL-CAPS headers):

1. EXECUTIVE SUMMARY — 2 short sentences with exact score and total anomaly count.

2. KEY FINDINGS — Focus on top issues only (up to 6 bullets), with specific event IDs, users, and risk scores.

3. METRICS SNAPSHOT — Short severity/type counts and failed checks.

4. INTEGRITY STATUS — Summarize failed checks and violations briefly.

5. RECOMMENDATIONS — 4-5 practical actions with priority labels.

FORMATTING RULES:
- Use plain text only, NO markdown at all (no **, ##, etc.)
- Use ALL-CAPS for section headers
- Use bullet points with the • character
- Keep language simple and readable for operations users
- Keep report between 220 and 320 words
- Include specific numbers, event IDs, and usernames where relevant
- Use professional pharmaceutical regulatory language"""

    system_instruction = (
        "You are a senior pharmaceutical compliance auditor with 15 years of experience in "
        "21 CFR Part 11 compliance. You write detailed, data-driven audit reports that reference "
        "specific events, users, and risk scores. Your reports are used by regulatory inspectors "
        "and must be precise and thorough. Never use markdown formatting. "
        "CRITICAL INSTRUCTION: Always completely finish your analysis and ensure you never cut off a sentence. Provide a full, conclusive report."
    )

    # Try Gemini AI, fall back to template if API key missing
    try:
        from shared_ai.factory import get_ai_provider
        ai = get_ai_provider()
        summary_text = await ai.generate_text(
            prompt=prompt,
            system_instruction=system_instruction,
            temperature=0.3,
            max_tokens=1600,
        )
        if not _is_complete_report(summary_text):
            logger.warning("[/reports/generate] AI report looked incomplete; using deterministic fallback")
            summary_text = _generate_fallback_report(
                total_anomalies, compliance_score, recent_anomalies, violations
            )
    except Exception as e:
        logger.warning("[/reports/generate] AI report generation failed; using fallback: %s", e)
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
        raise HTTPException(status_code=500, detail="Failed to save generated report.")


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

    return f"""EXECUTIVE SUMMARY

This {now} compliance snapshot shows an overall score of {compliance_score}% with {total_anomalies} anomalies currently recorded. Immediate attention is required for unresolved integrity and access-control findings.

KEY FINDINGS

{violation_items if violation_items else "• No critical integrity violations were found in this interval."}

METRICS SNAPSHOT

• Total anomalies: {total_anomalies}
• Compliance score: {compliance_score}%
• Data source: operational audit database

RECENT EVENTS

{anomaly_items if anomaly_items else "• No high-priority recent anomalies."}

RECOMMENDATIONS

• IMMEDIATE: Review high-severity anomalies in the Anomalies view and assign owners.
• IMMEDIATE: Resolve any missing electronic signatures on critical actions.
• SHORT-TERM: Revalidate RBAC permissions for users in violations.
• SHORT-TERM: Confirm off-hours action controls are enforced.
• LONG-TERM: Enable AI provider configuration for enriched narrative reports."""
