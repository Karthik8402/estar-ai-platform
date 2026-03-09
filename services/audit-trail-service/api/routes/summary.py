"""GET /summary — Mandatory contract endpoint (JWT deferred)."""

import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from db.database import get_db
from db.models import AuditAnomaly, IntegrityCheck, FactAuditEvent, AgentConfig

router = APIRouter()
logger = logging.getLogger("audit-trail-service")


@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    """Dashboard card stats — displayed on the landing page service card."""
    try:
        # Total events processed
        total_processed = db.query(func.count(FactAuditEvent.event_id)).scalar() or 0

        # Alerts today
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        alerts_today = (
            db.query(func.count(AuditAnomaly.id))
            .filter(AuditAnomaly.timestamp >= today_start)
            .filter(AuditAnomaly.severity.in_(["warn", "error", "critical"]))
            .scalar() or 0
        )

        # Last agent run
        last_agent = (
            db.query(AgentConfig)
            .filter(AgentConfig.last_run.isnot(None))
            .order_by(AgentConfig.last_run.desc())
            .first()
        )
        last_run = (
            last_agent.last_run.isoformat() + "Z"
            if last_agent and last_agent.last_run
            else datetime.now(timezone.utc).isoformat()
        )

        # Compliance score: based on integrity checks
        total_checks = db.query(func.count(IntegrityCheck.id)).scalar() or 1
        passed_checks = (
            db.query(func.count(IntegrityCheck.id))
            .filter(IntegrityCheck.passed == True)
            .scalar() or 0
        )
        compliance_score = int((passed_checks / total_checks) * 100) if total_checks > 0 else 0

        # Quick stats
        total_anomalies = db.query(func.count(AuditAnomaly.id)).scalar() or 0
        integrity_passed = passed_checks

        return {
            "total_processed": total_processed,
            "alerts_today": alerts_today,
            "last_run": last_run,
            "compliance_score": compliance_score,
            "quick_stats": {
                "logs_analyzed_today": total_processed,
                "anomalies_flagged": total_anomalies,
                "integrity_checks_passed": integrity_passed,
                "human_errors_detected": (
                    db.query(func.count(AuditAnomaly.id))
                    .filter(AuditAnomaly.anomaly_type == "human_error")
                    .scalar() or 0
                ),
            },
        }

    except Exception as e:
        logger.error(f"[/summary] Database query failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch summary: {str(e)}")
