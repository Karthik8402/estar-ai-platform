"""GET /reports/anomalies — Paginated + filtered anomaly list."""

import logging
from fastapi import APIRouter, Query, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from math import ceil

from db.database import get_db
from db.models import AuditAnomaly, AgentConfig

router = APIRouter()
logger = logging.getLogger("audit-trail-service")


@router.api_route("/reports/anomalies", methods=["GET", "HEAD"])
def get_anomalies(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    severity: str | None = Query(default=None, max_length=20),
    type: str | None = Query(default=None, max_length=50),
    search: str | None = Query(default=None, max_length=120),
    db: Session = Depends(get_db),
):
    """Paginated anomaly list with filters for the AnomalyTable dashboard section."""
    try:
        query = db.query(AuditAnomaly)

        # Apply filters
        if severity and severity != "all":
            query = query.filter(AuditAnomaly.severity == severity)
        if type and type != "all":
            query = query.filter(AuditAnomaly.anomaly_type == type)
        if search:
            search_term = f"%{search.lower()}%"
            query = query.filter(
                (func.lower(AuditAnomaly.message).like(search_term))
                | (func.lower(AuditAnomaly.user).like(search_term))
            )

        # Count total
        total = query.count()
        total_pages = ceil(total / limit) if total > 0 else 1

        # Paginate
        offset = (page - 1) * limit
        anomalies = (
            query
            .order_by(AuditAnomaly.timestamp.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        items = []
        for a in anomalies:
            items.append({
                "event_id": a.event_id,
                "timestamp": a.timestamp.isoformat() + "Z" if a.timestamp else None,
                "anomaly_type": a.anomaly_type,
                "severity": a.severity,
                "message": a.message,
                "risk_score": a.risk_score,
                "ai_confidence": a.ai_confidence,
                "user": a.user,
                "session_id": a.session_id,
                "ip_address": a.ip_address,
                "raw_payload": a.raw_payload or {},
            })

        # Use Agent 1 run time as authoritative anomaly "last check" timestamp.
        agent_last_run = (
            db.query(AgentConfig.last_run)
            .filter(AgentConfig.agent_id == "agent_1")
            .scalar()
        )

        return {
            "items": items,
            "total": total,
            "page": page,
            "totalPages": total_pages,
            "last_check": agent_last_run.isoformat() + "Z" if agent_last_run else None,
        }

    except Exception as e:
        logger.error(f"[/reports/anomalies] Database query failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch anomalies.")
