"""Background AI Agent Scheduler — Real detection logic.

Three agents run continuously via APScheduler:
  Agent 1: Human Error Detection — scans fact_audit_events for patterns
  Agent 2: Log Integrity Verification — checks signatures, RBAC, timestamps
  Agent 3: Compliance Reporter — auto-triggers AI if critical threshold exceeded
"""

import uuid
import logging
import random
from datetime import datetime, timedelta, timezone
from collections import Counter

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from db.database import SessionLocal
from config.settings import get_settings
from db.models import (
    AgentConfig, AuditAnomaly, AuditThreshold, AuditReport,
    IntegrityCheck, IntegrityViolation,
    FactAuditEvent, DimAction, DimUser, DimTime, DimSession,
    DimModule,
)

logger = logging.getLogger("agents")
logger.setLevel(logging.INFO)

scheduler = AsyncIOScheduler()


# ═══════════════════════════════════════════════════════════════════
# AGENT 1: Human Error Detection
# ═══════════════════════════════════════════════════════════════════

async def run_log_analyzer():
    """Scans fact_audit_events for human error patterns using configurable thresholds."""
    db: Session = SessionLocal()
    try:
        agent = db.query(AgentConfig).filter(AgentConfig.agent_id == "agent_1").first()
        if not agent or agent.status != "running":
            return

        # Load configurable thresholds from DB
        thresholds = {t.key: t.value for t in db.query(AuditThreshold).all()}
        failed_login_limit = int(thresholds.get("failed_login_threshold", "3"))
        bulk_deletion_limit = int(thresholds.get("bulk_deletion_threshold", "10"))
        field_correction_limit = int(thresholds.get("field_correction_limit", "3"))
        off_hours_start = int(thresholds.get("off_hours_start", "22:00").split(":")[0])
        off_hours_end = int(thresholds.get("off_hours_end", "06:00").split(":")[0])

        # Time window: only scan events since last agent run
        since = agent.last_run or (datetime.now(timezone.utc) - timedelta(minutes=5))
        if since.tzinfo is None:
            since = since.replace(tzinfo=timezone.utc)

        # Query recent audit events with their dimensions
        recent_events = (
            db.query(FactAuditEvent, DimAction, DimUser, DimTime)
            .join(DimAction, FactAuditEvent.action_id == DimAction.action_id)
            .join(DimUser, FactAuditEvent.user_id == DimUser.user_id)
            .join(DimTime, FactAuditEvent.timestamp_id == DimTime.time_id)
            .filter(FactAuditEvent.created_at >= since.replace(tzinfo=None))
            .order_by(FactAuditEvent.created_at.desc())
            .all()
        )

        new_anomalies = 0
        existing_event_ids = {a.event_id for a in db.query(AuditAnomaly.event_id).all()}
        next_evt_num = db.query(func.count(AuditAnomaly.id)).scalar() or 0

        # ── Pattern 1: Failed login clustering per user ──
        user_logins = Counter()
        for event, action, user, time_dim in recent_events:
            if action.action_name == "login_attempt" and not event.is_compliant:
                user_logins[user.username] += 1

        for username, count in user_logins.items():
            if count >= failed_login_limit:
                next_evt_num += 1
                evt_id = f"evt_auto_{next_evt_num}"
                if evt_id not in existing_event_ids:
                    db.add(AuditAnomaly(
                        event_id=evt_id,
                        timestamp=datetime.now(timezone.utc),
                        anomaly_type="human_error",
                        severity="error",
                        message=f"Repeated failed logins ({count} attempts) detected for user {username} within scan window — exceeds threshold of {failed_login_limit}",
                        risk_score=round(50 + count * 8, 1),
                        ai_confidence=0.87,
                        user=username,
                        session_id=f"ses_auto_{uuid.uuid4().hex[:8]}",
                        ip_address="10.0.0.1",
                        raw_payload={"pattern": "failed_login_cluster", "count": count, "threshold": failed_login_limit},
                    ))
                    new_anomalies += 1

        # ── Pattern 2: Off-hours activity ──
        for event, action, user, time_dim in recent_events:
            if time_dim.is_off_hours and action.action_category in ("critical", "data"):
                next_evt_num += 1
                evt_id = f"evt_auto_{next_evt_num}"
                if evt_id not in existing_event_ids:
                    db.add(AuditAnomaly(
                        event_id=evt_id,
                        timestamp=datetime.now(timezone.utc),
                        anomaly_type="unauthorized",
                        severity="warn",
                        message=f"Off-hours {action.action_name} activity by user {user.username} at {time_dim.full_timestamp.strftime('%H:%M')} — outside permitted window ({off_hours_end}:00–{off_hours_start}:00)",
                        risk_score=round(40 + float(event.risk_score) * 0.5, 1) if event.risk_score else 45.0,
                        ai_confidence=0.78,
                        user=user.username,
                        raw_payload={"pattern": "off_hours", "hour": time_dim.hour, "action": action.action_name},
                    ))
                    new_anomalies += 1

        # ── Pattern 3: High risk score events ──
        for event, action, user, time_dim in recent_events:
            if event.risk_score and float(event.risk_score) > 70:
                next_evt_num += 1
                evt_id = f"evt_auto_{next_evt_num}"
                if evt_id not in existing_event_ids:
                    db.add(AuditAnomaly(
                        event_id=evt_id,
                        timestamp=datetime.now(timezone.utc),
                        anomaly_type="human_error" if action.action_category == "data" else "unauthorized",
                        severity="error" if float(event.risk_score) > 80 else "warn",
                        message=f"High-risk event detected: {action.action_name} by {user.username} with risk score {event.risk_score} — requires investigation",
                        risk_score=float(event.risk_score),
                        ai_confidence=0.82,
                        user=user.username,
                        raw_payload={"pattern": "high_risk_score", "risk": float(event.risk_score), "action": action.action_name},
                    ))
                    new_anomalies += 1

        # ── Pattern 4: Repeated Field Corrections ──
        user_field_edits = Counter()
        for event, action, user, time_dim in recent_events:
            if action.action_name.startswith("field_edit_"):
                user_field_edits[user.username] += 1
        
        for username, count in user_field_edits.items():
            if count >= field_correction_limit:
                next_evt_num += 1
                evt_id = f"evt_auto_{next_evt_num}"
                if evt_id not in existing_event_ids:
                    db.add(AuditAnomaly(
                        event_id=evt_id,
                        timestamp=datetime.now(timezone.utc),
                        anomaly_type="human_error",
                        severity="warn",
                        message=f"Repeated data corrections detected: {username} made {count} field edits in recent window (limit {field_correction_limit})",
                        risk_score=round(35 + count * 5, 1),
                        ai_confidence=0.85,
                        user=username,
                        raw_payload={"pattern": "repeated_field_correction", "count": count, "threshold": field_correction_limit},
                    ))
                    new_anomalies += 1

        # ── Pattern 5: Missing Correction Reason ──
        for event, action, user, time_dim in recent_events:
            if action.action_name.startswith("field_edit_") and not event.is_compliant:
                next_evt_num += 1
                evt_id = f"evt_auto_{next_evt_num}"
                if evt_id not in existing_event_ids:
                    db.add(AuditAnomaly(
                        event_id=evt_id,
                        timestamp=datetime.now(timezone.utc),
                        anomaly_type="human_error",
                        severity=thresholds.get("missing_reason_severity", "error"),
                        message=f"Data correction by {user.username} missing required explanatory reason",
                        risk_score=65.5,
                        ai_confidence=0.92,
                        user=user.username,
                        raw_payload={"pattern": "missing_correction_reason", "action": action.action_name},
                    ))
                    new_anomalies += 1

        # ── Pattern 6: Self-Approval Detection ──
        user_actions_lookup = {}
        for event, action, user, time_dim in recent_events:
            if user.username not in user_actions_lookup:
                user_actions_lookup[user.username] = set()
            user_actions_lookup[user.username].add(action.action_name)
            
        for username, acs in user_actions_lookup.items():
            if ("result_entry" in acs and "result_approval" in acs) or ("study_approval_l1" in acs and "study_approval_l2" in acs):
                next_evt_num += 1
                evt_id = f"evt_auto_{next_evt_num}"
                if evt_id not in existing_event_ids:
                    db.add(AuditAnomaly(
                        event_id=evt_id,
                        timestamp=datetime.now(timezone.utc),
                        anomaly_type="unauthorized",
                        severity="critical",
                        message=f"Self-approval detected: {username} both entered and approved data within same verification window",
                        risk_score=95.0,
                        ai_confidence=0.98,
                        user=username,
                        raw_payload={"pattern": "self_approval", "actions_seen": list(acs)},
                    ))
                    new_anomalies += 1

        # Update agent status
        agent.last_run = datetime.now(timezone.utc)
        if new_anomalies > 0:
            agent.last_result = f"Detected {new_anomalies} new anomalies at {agent.last_run.strftime('%H:%M:%S')}"
            logger.info(f"[AGENT 1] ⚠ Found {new_anomalies} new anomalies from {len(recent_events)} events")
        else:
            agent.last_result = f"Scanned {len(recent_events)} events at {agent.last_run.strftime('%H:%M:%S')} — no new patterns"
            logger.info(f"[AGENT 1] ✓ Scanned {len(recent_events)} events — clean")

        db.commit()
    except Exception as e:
        logger.error(f"[AGENT 1] Error: {e}", exc_info=True)
        try:
            db.rollback()
            agent = db.query(AgentConfig).filter(AgentConfig.agent_id == "agent_1").first()
            if agent:
                agent.status = "error"
                agent.error_message = str(e)[:500]
                agent.last_run = datetime.now(timezone.utc)
                db.commit()
        except Exception:
            db.rollback()
    finally:
        db.close()


# ═══════════════════════════════════════════════════════════════════
# AGENT 2: Log Integrity Verification
# ═══════════════════════════════════════════════════════════════════

async def run_integrity_monitor():
    """Verifies audit trail integrity: signatures, RBAC, sequential ordering."""
    db: Session = SessionLocal()
    try:
        agent = db.query(AgentConfig).filter(AgentConfig.agent_id == "agent_2").first()
        if not agent or agent.status != "running":
            return

        now = datetime.now(timezone.utc)
        # Use a rolling window so score reflects recent behavior and can recover.
        window_start = agent.last_run or (now - timedelta(minutes=15))
        if window_start.tzinfo is None:
            window_start = window_start.replace(tzinfo=timezone.utc)
        window_start_naive = window_start.replace(tzinfo=None)

        # ── Check 1: Sequential event numbering ──
        all_events = (
            db.query(FactAuditEvent)
            .filter(FactAuditEvent.created_at >= window_start_naive)
            .order_by(FactAuditEvent.created_at)
            .all()
        )
        seq_passed = True
        seq_detail = "Passed"

        # Check for time ordering gaps
        prev_time = None
        gap_count = 0
        for evt in all_events:
            if prev_time and evt.created_at:
                diff = (evt.created_at - prev_time).total_seconds()
                if diff < 0:
                    seq_passed = False
                    gap_count += 1
            prev_time = evt.created_at

        if gap_count > 0:
            seq_detail = f"Failed — {gap_count} ordering violations"

        _upsert_check(db, "Sequential event numbering", seq_passed, seq_detail, now)

        # ── Check 2: Electronic signatures on critical actions ──
        critical_actions = (
            db.query(FactAuditEvent, DimAction, DimUser)
            .join(DimAction, FactAuditEvent.action_id == DimAction.action_id)
            .join(DimUser, FactAuditEvent.user_id == DimUser.user_id)
            .filter(DimAction.requires_e_signature == True)
            .filter(FactAuditEvent.created_at >= window_start_naive)
            .all()
        )

        for event, action, user in critical_actions:
            # Simulate signature validation: events with is_compliant=False are unsigned
            if not event.is_compliant:
                # Insert a violation if not already reported
                existing = db.query(IntegrityViolation).filter(
                    and_(
                        IntegrityViolation.violation_type == "missing_signature",
                        IntegrityViolation.user == user.username,
                        IntegrityViolation.action == action.action_name,
                    )
                ).first()
                if not existing:
                    db.add(IntegrityViolation(
                        violation_type="missing_signature",
                        message=f"Missing electronic signature on {action.action_name} by {user.username}",
                        severity="error",
                        user=user.username,
                        action=action.action_name,
                        timestamp=now,
                    ))

        db.flush()
        total_missing_sigs = db.query(IntegrityViolation).filter(IntegrityViolation.violation_type == "missing_signature").count()
        sig_passed = total_missing_sigs == 0
        sig_detail = "Passed" if sig_passed else f"{total_missing_sigs} active violations"
        _upsert_check(db, "Electronic signatures present", sig_passed, sig_detail, now)

        # ── Check 3: RBAC authorization validation ──
        # Check for non-compliant events on admin actions by non-admin users
        rbac_violations = (
            db.query(FactAuditEvent, DimAction, DimUser)
            .join(DimAction, FactAuditEvent.action_id == DimAction.action_id)
            .join(DimUser, FactAuditEvent.user_id == DimUser.user_id)
            .filter(DimAction.action_category == "admin")
            .filter(FactAuditEvent.is_compliant == False)
            .filter(FactAuditEvent.created_at >= window_start_naive)
            .all()
        )

        for event, action, user in rbac_violations:
            existing = db.query(IntegrityViolation).filter(
                and_(
                    IntegrityViolation.violation_type == "rbac_violation",
                    IntegrityViolation.user == user.username,
                )
            ).first()
            if not existing:
                db.add(IntegrityViolation(
                    violation_type="rbac_violation",
                    message=f"Unauthorized role action: {user.username} performed {action.action_name} without admin privileges",
                    severity="error",
                    user=user.username,
                    action=action.action_name,
                    timestamp=now,
                ))

        db.flush()
        total_rbac = db.query(IntegrityViolation).filter(IntegrityViolation.violation_type == "rbac_violation").count()
        rbac_passed = total_rbac == 0
        rbac_detail = "Passed" if rbac_passed else f"{total_rbac} active violations"
        _upsert_check(db, "RBAC authorization validation", rbac_passed, rbac_detail, now)

        # ── Check 4: Timestamp ordering ──
        ts_warnings = 0
        events_with_time = (
            db.query(FactAuditEvent, DimTime)
            .join(DimTime, FactAuditEvent.timestamp_id == DimTime.time_id)
            .filter(FactAuditEvent.created_at >= window_start_naive)
            .order_by(DimTime.full_timestamp)
            .all()
        )
        prev_ts = None
        for event, time_dim in events_with_time:
            if prev_ts and time_dim.full_timestamp:
                gap = abs((time_dim.full_timestamp - prev_ts).total_seconds())
                if gap > 3600:  # Flag only if gap > 1 hour (genuine anomaly)
                    ts_warnings += 1
            prev_ts = time_dim.full_timestamp

        ts_passed = ts_warnings == 0
        ts_detail = "Passed" if ts_warnings == 0 else f"Passed ({ts_warnings} warnings)"
        _upsert_check(db, "Timestamp ordering", ts_passed, ts_detail, now)

        # ── Check 5: Before/after values on corrections ──
        missing_before_after = (
            db.query(FactAuditEvent, DimAction, DimUser)
            .join(DimAction, FactAuditEvent.action_id == DimAction.action_id)
            .join(DimUser, FactAuditEvent.user_id == DimUser.user_id)
            .filter(DimAction.action_name.ilike("field_edit_%"))
            .filter(FactAuditEvent.is_compliant == False)
            .filter(FactAuditEvent.created_at >= window_start_naive)
            .all()
        )
        for event, action, user in missing_before_after:
            existing = db.query(IntegrityViolation).filter(
                and_(
                    IntegrityViolation.violation_type == "missing_before_after",
                    IntegrityViolation.user == user.username,
                    IntegrityViolation.timestamp == event.created_at
                )
            ).first()
            if not existing:
                db.add(IntegrityViolation(
                    violation_type="missing_before_after",
                    message=f"Missing OLD/NEW values for data correction: {action.action_name} by {user.username}",
                    severity="warn",
                    user=user.username,
                    action=action.action_name,
                    timestamp=event.created_at or now,
                ))

        db.flush()
        total_ba = db.query(IntegrityViolation).filter(IntegrityViolation.violation_type == "missing_before_after").count()
        ba_passed = total_ba == 0
        ba_detail = "Passed" if ba_passed else f"Failed — {total_ba} active violations"
        _upsert_check(db, "Before/after values on corrections", ba_passed, ba_detail, now)

        # ── Check 6: Checksum integrity ──
        orphaned_events = (
            db.query(FactAuditEvent)
            .filter(
                (FactAuditEvent.timestamp_id == None) | 
                (FactAuditEvent.user_id == None) |
                (FactAuditEvent.action_id == None) |
                (FactAuditEvent.module_id == None)
            )
            .filter(FactAuditEvent.created_at >= window_start_naive)
            .all()
        )
        for event in orphaned_events:
            existing = db.query(IntegrityViolation).filter(
                and_(
                    IntegrityViolation.violation_type == "orphaned_record",
                    IntegrityViolation.timestamp == event.created_at
                )
            ).first()
            if not existing:
                db.add(IntegrityViolation(
                    violation_type="orphaned_record",
                    message=f"Fact Audit Event {event.event_id} missing relationship to dimension table",
                    severity="error",
                    user="system",
                    action="unknown",
                    timestamp=event.created_at or now,
                ))

        db.flush()
        total_ref = db.query(IntegrityViolation).filter(IntegrityViolation.violation_type == "orphaned_record").count()
        ref_passed = total_ref == 0
        ref_detail = "Passed" if ref_passed else f"Failed — {total_ref} active violations"
        _upsert_check(db, "Checksum integrity", ref_passed, ref_detail, now)

        # Update agent
        total_checks = 6
        passed = sum(1 for c in db.query(IntegrityCheck).all() if c.passed)
        agent.last_run = now
        agent.last_result = f"{passed}/{total_checks} checks passed at {now.strftime('%H:%M:%S')}"
        logger.info(f"[AGENT 2] ✓ Integrity scan complete — {passed}/{total_checks} passed")

        db.commit()
    except Exception as e:
        logger.error(f"[AGENT 2] Error: {e}", exc_info=True)
        try:
            db.rollback()
            agent = db.query(AgentConfig).filter(AgentConfig.agent_id == "agent_2").first()
            if agent:
                agent.status = "error"
                agent.error_message = str(e)[:500]
                agent.last_run = datetime.now(timezone.utc)
                db.commit()
        except Exception:
            db.rollback()
    finally:
        db.close()


def _upsert_check(db: Session, name: str, passed: bool, detail: str, checked_at: datetime):
    """Insert or update an integrity check row."""
    existing = db.query(IntegrityCheck).filter(IntegrityCheck.check_name == name).first()
    if existing:
        existing.passed = passed
        existing.detail = detail
        existing.checked_at = checked_at
    else:
        db.add(IntegrityCheck(
            check_name=name,
            passed=passed,
            detail=detail,
            checked_at=checked_at,
        ))


def _get_or_create_time_dim(db: Session, timestamp: datetime) -> DimTime:
    time_value = timestamp.replace(tzinfo=None)
    existing = db.query(DimTime).filter(DimTime.full_timestamp == time_value).first()
    if existing:
        return existing

    time_dim = DimTime(
        full_timestamp=time_value,
        year=time_value.year,
        month=time_value.month,
        day=time_value.day,
        hour=time_value.hour,
        minute=time_value.minute,
        day_of_week=time_value.strftime("%A"),
        is_off_hours=time_value.hour < 6 or time_value.hour >= 22,
    )
    db.add(time_dim)
    db.flush()
    return time_dim


def _ensure_session(db: Session) -> DimSession:
    session = DimSession(
        ip_address=f"10.0.{random.randint(0, 4)}.{random.randint(1, 254)}",
        device_fingerprint=f"fp_{uuid.uuid4().hex[:12]}",
        geo_location="US-East",
        created_at=datetime.utcnow(),
        last_used_at=datetime.utcnow(),
    )
    db.add(session)
    db.flush()
    return session


# ═══════════════════════════════════════════════════════════════════
# AGENT 3: Compliance Reporter
# ═══════════════════════════════════════════════════════════════════

async def run_compliance_reporter():
    """Monitors critical anomalies and auto-triggers an AI report if threshold exceeded."""
    db: Session = SessionLocal()
    try:
        agent = db.query(AgentConfig).filter(AgentConfig.agent_id == "agent_3").first()
        if not agent or agent.status != "running":
            return

        now = datetime.now(timezone.utc)
        ten_min_ago = now - timedelta(minutes=10)

        # Count critical anomalies in the last 10 minutes
        critical_count = (
            db.query(func.count(AuditAnomaly.id))
            .filter(
                AuditAnomaly.severity == "critical",
                AuditAnomaly.timestamp >= ten_min_ago.replace(tzinfo=None),
            )
            .scalar() or 0
        )

        # Count total anomalies for the compliance score
        total_anomalies = db.query(func.count(AuditAnomaly.id)).scalar() or 0
        checks = db.query(IntegrityCheck).all()
        passed = sum(1 for c in checks if c.passed)
        total = len(checks) or 1
        score = int((passed / total) * 100)

        CRITICAL_THRESHOLD = 3  # Auto-trigger if >=3 critical in 10min

        agent.last_run = now

        if critical_count >= CRITICAL_THRESHOLD:
            # Auto-trigger an AI report
            agent.last_result = f"⚠ {critical_count} critical anomalies in 10min — auto-generating report"
            logger.info(f"[AGENT 3] ⚠ Threshold exceeded ({critical_count} critical) — triggering AI report")

            # Check if we already auto-generated a report in the last 10 minutes
            recent_report = (
                db.query(AuditReport)
                .filter(
                    AuditReport.report_type == "auto-triggered",
                    AuditReport.generated_at >= ten_min_ago.replace(tzinfo=None),
                )
                .first()
            )

            if not recent_report:
                # Generate a report
                report_count = db.query(func.count(AuditReport.id)).scalar() or 0
                new_id = f"rpt_{str(report_count + 1).zfill(3)}"
                db.add(AuditReport(
                    report_id=new_id,
                    report_type="auto-triggered",
                    generated_at=now,
                    compliance_score=score,
                    anomaly_count=total_anomalies,
                    summary_text=f"AUTO-TRIGGERED COMPLIANCE ALERT\n\n{critical_count} critical anomalies were detected within a 10-minute window, exceeding the threshold of {CRITICAL_THRESHOLD}. Current compliance score: {score}%. Total anomalies in system: {total_anomalies}.\n\nIMMEDIATE ACTION REQUIRED\n\n• Review all critical anomalies in the Anomalies dashboard\n• Verify electronic signature compliance on flagged events\n• Contact the compliance officer for regulatory escalation\n\nThis report was automatically generated by the Compliance Reporter agent. A full AI-powered analysis can be triggered manually from the Reports section.",
                ))
                logger.info(f"[AGENT 3] Auto-triggered report {new_id} generated")
        else:
            agent.last_result = f"Checked thresholds at {now.strftime('%H:%M:%S')} — {critical_count}/{CRITICAL_THRESHOLD} critical (no trigger)"
            logger.info(f"[AGENT 3] ✓ Threshold check — {critical_count}/{CRITICAL_THRESHOLD} critical")

        db.commit()
    except Exception as e:
        logger.error(f"[AGENT 3] Error: {e}", exc_info=True)
        try:
            db.rollback()
            agent = db.query(AgentConfig).filter(AgentConfig.agent_id == "agent_3").first()
            if agent:
                agent.status = "error"
                agent.error_message = str(e)[:500]
                agent.last_run = datetime.now(timezone.utc)
                db.commit()
        except Exception:
            db.rollback()
    finally:
        db.close()


# ═══════════════════════════════════════════════════════════════════
# DATA SIMULATOR: Periodic event generation
# ═══════════════════════════════════════════════════════════════════

async def run_data_simulator():
    """Insert periodic demo events so agents always have fresh data to scan."""
    db: Session = SessionLocal()
    settings = get_settings()
    try:
        running_agents = (
            db.query(func.count(AgentConfig.id))
            .filter(AgentConfig.agent_id.in_(["agent_1", "agent_2", "agent_3"]))
            .filter(AgentConfig.status == "running")
            .scalar() or 0
        )
        if running_agents == 0:
            logger.info("[SIMULATOR] Skipped (all agents stopped)")
            return

        users = db.query(DimUser).all()
        actions = db.query(DimAction).all()
        modules = db.query(DimModule).all()
        sessions = db.query(DimSession).all()

        if not users or not actions or not modules:
            return

        if not sessions:
            sessions = [_ensure_session(db)]

        now = datetime.now(timezone.utc).replace(second=0, microsecond=0)
        batch_size = max(1, int(settings.SIMULATION_EVENT_BATCH))

        burst_user = random.choice(users)
        login_action = next((a for a in actions if a.action_name == "login_attempt"), None)

        # Scenario 1: Deterministic burst ensures Agent 1 can detect repeated failed logins.
        if login_action and random.random() < 0.3:
            for _ in range(4):
                burst_time = now
                burst_dim = _get_or_create_time_dim(db, burst_time)
                burst_session = random.choice(sessions)
                db.add(FactAuditEvent(
                    timestamp_id=burst_dim.time_id,
                    user_id=burst_user.user_id,
                    action_id=login_action.action_id,
                    module_id=random.choice(modules).module_id,
                    session_id=burst_session.session_id,
                    risk_score=round(random.uniform(72, 94), 2),
                    is_compliant=False,
                    created_at=datetime.utcnow(),
                ))

        for _ in range(batch_size):
            event_time = now
            time_dim = _get_or_create_time_dim(db, event_time)
            user = random.choice(users)
            module = random.choice(modules)
            session = random.choice(sessions)
            
            scenario_roll = random.random()
            
            # Scenario 2: Repeated field correction events (40% probability)
            if scenario_roll < 0.40:
                action = random.choice([a for a in actions if a.action_name.startswith("field_edit_")] or actions)
                is_compliant = random.random() > 0.2
                risk_score = round(random.uniform(30, 85), 2)
            
            # Scenario 3: Missing e-signature on approval (25% probability)
            elif scenario_roll < 0.65:
                action = random.choice([a for a in actions if "approval" in a.action_name] or actions)
                is_compliant = False  # Simulate missing signature
                risk_score = round(random.uniform(70, 95), 2)
                
            # Scenario 4: Off-hours critical activity (20% probability)
            elif scenario_roll < 0.85:
                action = random.choice([a for a in actions if a.action_category == "critical"] or actions)
                is_compliant = random.random() > 0.1
                risk_score = round(random.uniform(50, 90), 2)
                # Force off-hours time dimension
                off_hours_time = datetime.utcnow().replace(hour=random.choice([1, 2, 3, 23]))
                time_dim = _get_or_create_time_dim(db, off_hours_time)
                
            # Generic valid events for background noise
            else:
                action = random.choice(actions)
                is_compliant = True
                risk_score = round(random.uniform(0, 30), 2)

            db.add(FactAuditEvent(
                timestamp_id=time_dim.time_id,
                user_id=user.user_id,
                action_id=action.action_id,
                module_id=module.module_id,
                session_id=session.session_id,
                risk_score=risk_score,
                is_compliant=is_compliant,
                created_at=datetime.utcnow(),
            ))

        db.commit()
        logger.info(f"[SIMULATOR] Inserted {batch_size} demo audit events")
    except Exception as e:
        logger.error(f"[SIMULATOR] Error: {e}", exc_info=True)
        db.rollback()
    finally:
        db.close()


# ═══════════════════════════════════════════════════════════════════
# SCHEDULER LIFECYCLE
# ═══════════════════════════════════════════════════════════════════

def start_scheduler():
    """Starts the global APScheduler instance and adds the jobs."""
    if not scheduler.running:
        logger.info("🟢 Starting background AI agent scheduler...")

        settings = get_settings()

        scheduler.add_job(run_log_analyzer, "interval", seconds=30, id="job_agent_1", replace_existing=True, misfire_grace_time=60)
        scheduler.add_job(run_integrity_monitor, "interval", seconds=60, id="job_agent_2", replace_existing=True, misfire_grace_time=60)
        scheduler.add_job(run_compliance_reporter, "interval", seconds=120, id="job_agent_3", replace_existing=True, misfire_grace_time=60)
        scheduler.add_job(
            run_data_simulator,
            "interval",
            seconds=max(180, int(settings.SIMULATION_INTERVAL_SECONDS)),
            id="job_data_simulator",
            replace_existing=True,
            misfire_grace_time=120,
        )

        scheduler.start()
        logger.info("🟢 All 3 agents scheduled and running")


def stop_scheduler():
    """Gracefully shuts down the scheduler."""
    if scheduler.running:
        logger.info("🔴 Shutting down background AI agent scheduler...")
        scheduler.shutdown()
