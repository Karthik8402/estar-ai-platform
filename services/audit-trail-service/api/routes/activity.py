"""GET /activity/recent — Mandatory contract endpoint (JWT deferred)."""

import logging
from fastapi import APIRouter, Query, Depends, HTTPException
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import AuditAnomaly

router = APIRouter()
logger = logging.getLogger("audit-trail-service")


@router.get("/activity/recent")
def get_recent_activity(
    limit: int = Query(default=5, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Recent activity feed — merged into the landing page global timeline."""
    try:
        anomalies = (
            db.query(AuditAnomaly)
            .order_by(AuditAnomaly.timestamp.desc())
            .limit(limit)
            .all()
        )

        items = []
        for a in anomalies:
            items.append({
                "id": a.event_id,
                "timestamp": a.timestamp.isoformat() + "Z" if a.timestamp else None,
                "message": a.message,
                "severity": a.severity,
                "service": "audit-trail",
            })

        return {"items": items}

    except Exception as e:
        logger.error(f"[/activity/recent] Database query failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch recent activity: {str(e)}")
