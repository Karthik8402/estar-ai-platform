"""Seed the database with realistic demo data matching simulatedAuditData.ts."""

import uuid
import random
from datetime import datetime, timedelta

from db.database import engine, SessionLocal
from db.models import (
    Base, DimRole, DimUser, DimCompliance, DimModule, DimAction, DimSession,
    DimTime, FactAuditEvent, AuditAnomaly, IntegrityCheck, IntegrityViolation,
    AuditReport, AgentConfig, AuditThreshold, ComplianceRuleConfig,
)


def seed():
    """Drop all and re-create with seed data."""
    print("🗄️  Dropping existing tables...")
    Base.metadata.drop_all(bind=engine)

    print("🏗️  Creating tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # ─── Dimension: Roles ──────────────────────────
        roles = [
            DimRole(role_name="admin", permissions_json={"all": True}),
            DimRole(role_name="analyst", permissions_json={"read": True, "write": True}),
            DimRole(role_name="operator", permissions_json={"read": True, "write": True, "execute": True}),
            DimRole(role_name="lab_tech", permissions_json={"read": True, "data_entry": True}),
            DimRole(role_name="supervisor", permissions_json={"read": True, "approve": True}),
        ]
        db.add_all(roles)
        db.flush()

        # ─── Dimension: Users ─────────────────────────
        users_data = [
            ("jdoe", "jdoe@enviroapps.com", "analyst"),
            ("analyst3", "analyst3@enviroapps.com", "analyst"),
            ("supervisor1", "supervisor1@enviroapps.com", "supervisor"),
            ("operator_k", "karthik@enviroapps.com", "operator"),
            ("lab_tech_m", "maria@enviroapps.com", "lab_tech"),
            ("admin_r", "admin@enviroapps.com", "admin"),
        ]
        role_map = {r.role_name: r.role_id for r in roles}
        users = []
        for uname, email, rname in users_data:
            u = DimUser(username=uname, email=email, role_id=role_map[rname])
            users.append(u)
        db.add_all(users)
        db.flush()

        # ─── Dimension: Compliance ─────────────────────
        compliances = [
            DimCompliance(regulation_code="21CFR11", description="21 CFR Part 11 — Electronic Records and Signatures"),
            DimCompliance(regulation_code="ICH_Q1A", description="ICH Q1A — Stability Testing of New Drug Substances"),
            DimCompliance(regulation_code="ICH_Q1E", description="ICH Q1E — Evaluation for Stability Data"),
            DimCompliance(regulation_code="GMP", description="Good Manufacturing Practice"),
        ]
        db.add_all(compliances)
        db.flush()

        # ─── Dimension: Modules ────────────────────────
        modules = [
            DimModule(module_name="audit-trail", compliance_category_id=compliances[0].compliance_id),
            DimModule(module_name="data-entry", compliance_category_id=compliances[0].compliance_id),
            DimModule(module_name="stability-report", compliance_category_id=compliances[1].compliance_id),
            DimModule(module_name="oot-alerting", compliance_category_id=compliances[2].compliance_id),
        ]
        db.add_all(modules)
        db.flush()

        # ─── Dimension: Actions ────────────────────────
        actions = [
            DimAction(action_name="login_attempt", action_category="auth", requires_e_signature=False),
            DimAction(action_name="data_correction", action_category="data", requires_e_signature=False),
            DimAction(action_name="batch_release", action_category="critical", requires_e_signature=True),
            DimAction(action_name="admin_config", action_category="admin", requires_e_signature=True),
            DimAction(action_name="report_approval", action_category="review", requires_e_signature=True),
            DimAction(action_name="record_deletion", action_category="data", requires_e_signature=True),
        ]
        db.add_all(actions)
        db.flush()

        # ─── Dimension: Sessions ───────────────────────
        sessions = []
        for _ in range(10):
            s = DimSession(
                ip_address=f"10.0.{random.randint(0,4)}.{random.randint(1,254)}",
                device_fingerprint=f"fp_{uuid.uuid4().hex[:12]}",
                geo_location="US-East",
                created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 48)),
            )
            sessions.append(s)
        db.add_all(sessions)
        db.flush()

        # ─── Dimension: Time ──────────────────────────
        now = datetime.utcnow()
        time_dims = []
        for i in range(100):
            t = now - timedelta(minutes=i * 15)
            td = DimTime(
                full_timestamp=t,
                year=t.year, month=t.month, day=t.day,
                hour=t.hour, minute=t.minute,
                day_of_week=t.strftime("%A"),
                is_off_hours=t.hour < 6 or t.hour >= 22,
            )
            time_dims.append(td)
        db.add_all(time_dims)
        db.flush()

        # ─── Fact: Audit Events ────────────────────────
        for i in range(50):
            evt = FactAuditEvent(
                timestamp_id=time_dims[i % len(time_dims)].time_id,
                user_id=users[i % len(users)].user_id,
                action_id=actions[i % len(actions)].action_id,
                module_id=modules[i % len(modules)].module_id,
                session_id=sessions[i % len(sessions)].session_id,
                risk_score=round(random.uniform(0, 85), 2),
                is_compliant=random.random() > 0.06,
            )
            db.add(evt)
        db.flush()

        # ─── Anomalies (47 unique items) ──────────────────────────
        anomaly_data = [
            # CRITICAL anomalies
            ("critical", "unauthorized", "Same field edited 4 times in one session by user jdoe — potential data manipulation", "jdoe", 92.1),
            ("critical", "integrity_fail", "Missing electronic signature on batch release #312 — 21 CFR Part 11.10(b) violation", "jdoe", 95.3),
            ("critical", "unauthorized", "Bulk deletion of 23 stability records in under 15 seconds — possible data destruction", "operator_k", 91.7),
            ("critical", "unauthorized", "Admin credentials used from unregistered device at 03:42 local time", "admin_r", 88.4),
            ("critical", "integrity_fail", "Checksum mismatch on audit trail block #7841 — potential log tampering detected", "system", 97.0),
            # ERROR anomalies
            ("error", "human_error", "Repeated failed logins (4 attempts) followed by successful login and immediate data correction on record #4521", "jdoe", 78.2),
            ("error", "integrity_fail", "Role mismatch: analyst3 attempted admin-level configuration change without RBAC authorization", "analyst3", 82.5),
            ("error", "unauthorized", "Off-hours modification at 02:14 local time — batch release #312 approved without supervisor", "operator_k", 75.9),
            ("error", "human_error", "Data correction without required electronic signature on stability test result #8812", "jdoe", 71.3),
            ("error", "unauthorized", "Failed login attempts from new IP address range 192.168.5.x — possible brute force", "unknown", 80.1),
            ("error", "integrity_fail", "Electronic signature mismatch on batch release document #445 — signer ID does not match session user", "supervisor1", 85.6),
            ("error", "unauthorized", "Unauthorized access attempt to compliance configuration panel from lab workstation", "lab_tech_m", 73.8),
            ("error", "human_error", "Stability test pH value changed from 6.8 to 7.2 without documented justification", "analyst3", 69.4),
            ("error", "integrity_fail", "Timestamp gap of 47 seconds between sequential events #4480 and #4481", "system", 67.2),
            ("error", "unauthorized", "User operator_k accessed restricted module 'admin-config' outside authorized role scope", "operator_k", 76.5),
            # WARN anomalies
            ("warn", "human_error", "Bulk deletion of 14 records in under 30 seconds — review recommended", "analyst3", 55.3),
            ("warn", "human_error", "Multiple password resets within 10 minutes for user jdoe — possible credential sharing", "jdoe", 48.7),
            ("warn", "integrity_fail", "Audit log entry missing before/after values on record #3392 correction", "lab_tech_m", 52.1),
            ("warn", "unauthorized", "Access from unregistered device during restricted hours (Saturday 22:15)", "operator_k", 58.9),
            ("warn", "human_error", "Repeated validation overrides on pH measurements for batch #556 — 3 overrides in 1 hour", "analyst3", 61.2),
            ("warn", "human_error", "Critical action performed without supervisor approval — sample disposal #221", "lab_tech_m", 54.6),
            ("warn", "integrity_fail", "Sequential event numbering gap: events #5102 to #5104 (event #5103 missing)", "system", 45.3),
            ("warn", "unauthorized", "Login from geographic location inconsistent with user profile — US-West vs registered US-East", "jdoe", 50.8),
            ("warn", "human_error", "Dissolution test result manually overridden without QA counter-signature", "analyst3", 57.4),
            ("warn", "integrity_fail", "Session duration exceeded 12-hour policy limit — session active for 14h 23m", "operator_k", 43.2),
            ("warn", "human_error", "Duplicate data entry detected: same stability result entered twice within 5 minutes", "lab_tech_m", 39.8),
            ("warn", "unauthorized", "API key used from unauthorized service endpoint — internal microservice misconfiguration", "system", 62.1),
            ("warn", "human_error", "Temperature excursion data point manually deleted and re-entered with different value", "jdoe", 66.5),
            ("warn", "integrity_fail", "Digital certificate for e-signature nearing expiration (7 days remaining) for user supervisor1", "supervisor1", 38.4),
            ("warn", "human_error", "Assay result changed from 98.2% to 99.1% — outside acceptable correction tolerance of ±0.5%", "analyst3", 64.7),
            ("warn", "unauthorized", "Concurrent sessions detected: user jdoe logged in from 2 different IP addresses simultaneously", "jdoe", 53.2),
            ("warn", "human_error", "Impurity test result deleted and re-analyzed without opening a deviation report", "lab_tech_m", 59.3),
            ("warn", "integrity_fail", "Backup verification failed: audit trail backup hash does not match primary database", "system", 70.1),
            ("warn", "human_error", "Stability chamber temperature reading manually adjusted in LIMS without instrument log correlation", "operator_k", 47.6),
            ("warn", "unauthorized", "User admin_r account accessed after 90 days of inactivity — dormant account policy violation", "admin_r", 44.9),
            ("warn", "human_error", "Water activity measurement rejected 3 times before acceptance on batch #789", "analyst3", 41.5),
            ("warn", "integrity_fail", "Time synchronization drift detected: server clock 3.2 seconds ahead of NTP reference", "system", 36.7),
            ("warn", "human_error", "Cleaning validation record modified after final approval — requires investigation", "supervisor1", 63.8),
            ("warn", "unauthorized", "VPN connection from blacklisted IP range used to access audit portal", "unknown", 71.4),
            ("warn", "human_error", "Raw material CoA manually entered instead of imported from supplier system", "lab_tech_m", 35.2),
            ("warn", "integrity_fail", "Database index rebuild triggered unexpectedly during peak operational hours", "system", 33.1),
            ("warn", "human_error", "Particle count test manually failed and retested 4 times on same sample vial", "analyst3", 56.8),
            ("warn", "unauthorized", "PrintScreen key detected during classified document viewing session", "operator_k", 42.3),
            ("warn", "human_error", "Environmental monitoring data point flagged as out-of-trend but not escalated", "lab_tech_m", 37.9),
            ("warn", "integrity_fail", "Orphaned database record: fact_audit_event #9923 has no linked dim_time entry", "system", 31.5),
            ("warn", "human_error", "Weighing result transcription error: 150.2mg entered as 152.0mg on batch record #1102", "analyst3", 60.4),
            ("warn", "unauthorized", "Service account 'etl_pipeline' executed manual query against production audit tables", "system", 46.2),
        ]

        for i, (sev, atype, msg, user, risk) in enumerate(anomaly_data):
            mins = i * 12 + random.randint(0, 9)
            anom = AuditAnomaly(
                event_id=f"evt_{str(i+1).zfill(3)}",
                timestamp=now - timedelta(minutes=mins),
                anomaly_type=atype,
                severity=sev,
                message=msg,
                risk_score=risk,
                ai_confidence=round(0.6 + random.random() * 0.35, 3),
                user=user if user != "system" else None,
                session_id=f"ses_{uuid.uuid4().hex[:8]}",
                ip_address=f"10.0.{random.randint(0,4)}.{random.randint(1,254)}",
                raw_payload={
                    "action": atype,
                    "record_id": 4000 + i,
                    "module": ["data-entry", "audit-trail", "stability-report", "oot-alerting"][i % 4],
                },
            )
            db.add(anom)
        db.flush()

        # ─── Integrity ─────────────────────────────────
        integrity_checks = [
            IntegrityCheck(check_name="Sequential event numbering", passed=True, detail="Passed"),
            IntegrityCheck(check_name="Timestamp ordering", passed=True, detail="Passed (3 warnings)"),
            IntegrityCheck(check_name="Electronic signatures present", passed=False, detail="1 missing"),
            IntegrityCheck(check_name="RBAC authorization validation", passed=False, detail="1 violation"),
            IntegrityCheck(check_name="Before/after values on corrections", passed=True, detail="Passed"),
            IntegrityCheck(check_name="Checksum integrity", passed=True, detail="Passed"),
        ]
        db.add_all(integrity_checks)

        violations = [
            IntegrityViolation(
                violation_type="missing_signature",
                message="Missing electronic signature on critical action",
                severity="error",
                user="jdoe", action="batch_release",
                timestamp=now - timedelta(minutes=3),
            ),
            IntegrityViolation(
                violation_type="rbac_violation",
                message="Unauthorized role action detected",
                severity="error",
                user="analyst3", action="admin_config",
                timestamp=now - timedelta(minutes=7),
            ),
            IntegrityViolation(
                violation_type="timestamp_gap",
                message="Timestamp gap: 47s between event #4480 and #4481",
                severity="warn",
                timestamp=now - timedelta(minutes=11),
            ),
        ]
        db.add_all(violations)
        db.flush()

        # ─── Reports — computed from actual seeded data ───────
        # Count the seeded anomalies by severity and type
        all_seeded_anomalies = db.query(AuditAnomaly).all()
        total_anom = len(all_seeded_anomalies)
        critical_count = sum(1 for a in all_seeded_anomalies if a.severity == "critical")
        error_count = sum(1 for a in all_seeded_anomalies if a.severity == "error")
        warn_count = sum(1 for a in all_seeded_anomalies if a.severity == "warn")
        human_err_count = sum(1 for a in all_seeded_anomalies if a.anomaly_type == "human_error")
        integrity_count = sum(1 for a in all_seeded_anomalies if a.anomaly_type == "integrity_fail")
        unauth_count = sum(1 for a in all_seeded_anomalies if a.anomaly_type == "unauthorized")
        # Compliance score based on actual integrity checks seeded
        all_checks = db.query(IntegrityCheck).all()
        passed_chk = sum(1 for c in all_checks if c.passed)
        total_chk = len(all_checks) or 1
        daily_score = int((passed_chk / total_chk) * 100)
        # All violations seeded
        all_viols = db.query(IntegrityViolation).all()

        daily_text = f"""OFFICIAL DAILY AUDIT REPORT — eSTAR AI Platform
Report Date: {(now - timedelta(hours=1)).strftime('%B %d, %Y at %H:%M UTC')}
Report Type: DAILY

EXECUTIVE SUMMARY

The audit trail system processed {total_anom} anomaly events during the daily reporting period. The overall compliance score is {daily_score}% based on {len(all_checks)} integrity checks. {critical_count} critical and {error_count} error-level anomalies were detected requiring attention.

CRITICAL FINDINGS

• {critical_count} CRITICAL anomalies detected — highest risk events include unauthorized data manipulation, missing electronic signatures, and checksum verification failures breaching 21 CFR Part 11.10(a) requirements.
• {error_count} ERROR-level events flagged — including repeated failed login clustering, off-hours batch release approvals, and role mismatch violations requiring RBAC remediation.
• {len(all_viols)} integrity violations recorded by Log Integrity Verification agent — {sum(1 for v in all_viols if v.violation_type == 'missing_signature')} missing electronic signatures, {sum(1 for v in all_viols if v.violation_type == 'rbac_violation')} RBAC violations.

ANOMALY ANALYSIS

• Total anomalies: {total_anom}
• By severity — CRITICAL: {critical_count} | ERROR: {error_count} | WARN: {warn_count}
• By type — Human Error: {human_err_count} | Integrity Failures: {integrity_count} | Unauthorized: {unauth_count}
• All {len(all_checks)} integrity checks executed — {passed_chk} passed, {total_chk - passed_chk} failed.

INTEGRITY ASSESSMENT

Sequential event ordering: Verified
Electronic signatures: {sum(1 for v in all_viols if v.violation_type == 'missing_signature')} missing on critical actions
RBAC authorization: {sum(1 for v in all_viols if v.violation_type == 'rbac_violation')} unauthorized role violations detected
Checksum integrity: Passed for all verified blocks

RECOMMENDATIONS

• IMMEDIATE: Review all {critical_count} critical anomalies and initiate corrective action procedures per SOP-AUD-001
• IMMEDIATE: Resolve {len([v for v in all_viols if v.violation_type == 'missing_signature'])} missing electronic signature violations — retroactive signature collection required
• SHORT-TERM: Audit RBAC role assignments for users flagged in unauthorized access events
• SHORT-TERM: Implement additional authentication controls for off-hours critical actions
• LONG-TERM: Automate anomaly pattern detection thresholds based on rolling 30-day baseline"""

        weekly_text = f"""OFFICIAL WEEKLY AUDIT REPORT — eSTAR AI Platform
Report Date: {(now - timedelta(days=7)).strftime('%B %d, %Y at %H:%M UTC')}
Report Type: WEEKLY

EXECUTIVE SUMMARY

Weekly compliance summary covering the 7-day period. The audit trail system maintained a compliance score baseline with {total_anom} total anomalies recorded across all detection types. {critical_count} critical-severity events were detected requiring escalation.

KEY METRICS

• Total anomalies tracked: {total_anom}
• Critical events: {critical_count} | Error events: {error_count} | Warning events: {warn_count}
• Human error patterns: {human_err_count} | Integrity failures: {integrity_count} | Unauthorized access: {unauth_count}
• Integrity checks executed: {len(all_checks)} | Passed: {passed_chk} | Failed: {total_chk - passed_chk}
• Integrity violations recorded: {len(all_viols)}

NOTABLE FINDINGS

• {unauth_count} unauthorized access events detected — including off-hours admin access, concurrent session anomalies, and VPN usage from blacklisted ranges. These events require investigation under 21 CFR Part 11.10(d).
• {integrity_count} integrity-related failures identified — checksum mismatches, timestamp gaps, and orphaned database records indicate potential audit trail tampering concerns.
• Human error patterns ({human_err_count} events) continue to be the dominant anomaly type — recurring manual overrides, duplicate entries, and unsigned corrections suggest training gaps.

TREND ANALYSIS

The current distribution of {critical_count} critical and {error_count} error events across {total_anom} total anomalies represents system-wide compliance risk areas. Priority remediation of critical findings is required before the next scheduled regulatory review.

RECOMMENDATIONS

• SHORT-TERM: Implement mandatory re-training for users with >3 human error anomalies flagged
• SHORT-TERM: Review and tighten off-hours access window policy from 22:00–06:00
• LONG-TERM: Consider automated lockout for accounts exceeding unauthorized access threshold within 24 hours"""

        ondemand_text = f"""ON-DEMAND AUDIT REPORT — eSTAR AI Platform
Report Date: {(now - timedelta(days=9)).strftime('%B %d, %Y at %H:%M UTC')}
Report Type: ON-DEMAND

EXECUTIVE SUMMARY

This on-demand report was generated to investigate anomaly patterns in the audit trail database. Analysis covers all {total_anom} recorded anomalies across {human_err_count + integrity_count + unauth_count} distinct event categories with compliance score assessment based on {len(all_checks)} integrity checks.

INVESTIGATION SUMMARY

{critical_count + error_count} high-severity events were identified — {critical_count} classified as critical and {error_count} as error-level. Of the {total_anom} total anomalies, {unauth_count} unauthorized access events and {integrity_count} integrity failures represent the highest compliance risk under 21 CFR Part 11.

INTEGRITY VIOLATIONS DETAIL

{len(all_viols)} violations were flagged by the Log Integrity Verification agent:
• Missing electronic signatures: {sum(1 for v in all_viols if v.violation_type == 'missing_signature')} events — affects 21 CFR Part 11.10(b) compliance
• RBAC authorization violations: {sum(1 for v in all_viols if v.violation_type == 'rbac_violation')} events — affects 21 CFR Part 11.10(e) compliance
• Timestamp anomalies: {sum(1 for v in all_viols if v.violation_type == 'timestamp_gap')} events — affects audit trail completeness

RESOLUTION STATUS

• Affected accounts under review per identity management SOP
• Electronic signature remediation in progress for flagged batch release events
• No confirmed data integrity compromise — all checksum validations passing

RECOMMENDATIONS

• IMMEDIATE: Initiate formal CAPA for {critical_count} critical anomalies
• SHORT-TERM: Update electronic signature enforcement to prevent non-compliant submissions
• LONG-TERM: Schedule bi-annual RBAC access review for all system users"""

        reports = [
            AuditReport(report_id="rpt_001", report_type="daily",
                       generated_at=now - timedelta(hours=1), compliance_score=daily_score,
                       anomaly_count=total_anom, summary_text=daily_text),
            AuditReport(report_id="rpt_002", report_type="weekly",
                       generated_at=now - timedelta(days=7), compliance_score=max(daily_score - 5, 50),
                       anomaly_count=total_anom, summary_text=weekly_text),
            AuditReport(report_id="rpt_003", report_type="on-demand",
                       generated_at=now - timedelta(days=9), compliance_score=max(daily_score - 10, 50),
                       anomaly_count=total_anom, summary_text=ondemand_text),
        ]
        db.add_all(reports)
        db.flush()

        # ─── Agent Configs ─────────────────────────────
        agents = [
            AgentConfig(
                agent_id="agent_1", name="Human Error Detection",
                description="Detects operator mistakes — repeated failed logins, bulk deletions, off-hours modifications, repeated field corrections.",
                status="running", last_run=now - timedelta(minutes=2),
                cycle_seconds=30, last_result=f"Detected {warn_count} warning patterns from {total_anom} anomalies",
            ),
            AgentConfig(
                agent_id="agent_2", name="Log Integrity Verification",
                description="Verifies audit trail completeness — sequential ordering, electronic signatures, RBAC authorization, checksum validation.",
                status="running", last_run=now - timedelta(minutes=1),
                cycle_seconds=60, last_result=f"{passed_chk}/{total_chk} checks passed at {now.strftime('%H:%M:%S')}",
            ),
            AgentConfig(
                agent_id="agent_3", name="Compliance Reporter",
                description="Monitors critical anomaly thresholds and auto-triggers compliance reports when limits are exceeded. Also provides on-demand AI-powered analysis.",
                status="running", last_run=now - timedelta(minutes=3),
                cycle_seconds=120, last_result=f"Checked thresholds — {critical_count}/3 critical (no trigger)",
            ),
        ]
        db.add_all(agents)
        db.flush()

        # ─── Thresholds ───────────────────────────────
        thresholds = [
            AuditThreshold(key="failed_login_threshold", value="3", description="Max failed login attempts"),
            AuditThreshold(key="bulk_deletion_threshold", value="10", description="Max records in bulk delete"),
            AuditThreshold(key="off_hours_start", value="22:00", description="Off-hours window start"),
            AuditThreshold(key="off_hours_end", value="06:00", description="Off-hours window end"),
            AuditThreshold(key="field_correction_limit", value="3", description="Max corrections per session"),
            AuditThreshold(key="timestamp_tolerance", value="2", description="Seconds tolerance for timestamp gaps"),
        ]
        db.add_all(thresholds)

        # ─── Compliance Rules ──────────────────────────
        rules = [
            ComplianceRuleConfig(key="Regulation", value="21 CFR Part 11"),
            ComplianceRuleConfig(key="Electronic signatures", value="Required on CRITICAL actions"),
            ComplianceRuleConfig(key="Audit trail", value="Append-only (no UPDATE/DELETE)"),
            ComplianceRuleConfig(key="Access controls", value="RBAC validated per request"),
        ]
        db.add_all(rules)

        db.commit()
        print("✅ Seed data inserted successfully!")
        print(f"   • {len(users)} users, {len(roles)} roles")
        print(f"   • 47 anomalies, 3 violations, 6 integrity checks")
        print(f"   • 3 reports, 3 agents, 6 thresholds, 4 compliance rules")
        print(f"   • 50 fact audit events across dimensions")

    except Exception as e:
        db.rollback()
        print(f"❌ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
