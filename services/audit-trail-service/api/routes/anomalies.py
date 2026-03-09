"""GET /reports/anomalies — Paginated + filtered anomaly list."""

import logging
from fastapi import APIRouter, Query, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from math import ceil

from db.database import get_db
from db.models import AuditAnomaly

router = APIRouter()
logger = logging.getLogger("audit-trail-service")


@router.get("/reports/anomalies")
def get_anomalies(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    severity: str = Query(default=None),
    type: str = Query(default=None),
    search: str = Query(default=None),
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

        return {
            "items": items,
            "total": total,
            "page": page,
            "totalPages": total_pages,
        }

    except Exception as e:
        logger.error(f"[/reports/anomalies] Database query failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch anomalies: {str(e)}")
