"""GET /health — Mandatory contract endpoint (no auth)."""

import time
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import AuditAnomaly
from config.settings import get_settings

router = APIRouter()
logger = logging.getLogger("audit-trail-service")

# Track service start time
_start_time = time.time()


@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Service health check — polled by the landing page every 30s."""
    settings = get_settings()

    # Quick DB check
    db_ok = True
    try:
        db.execute(db.get_bind().dialect.do_ping if hasattr(db.get_bind(), 'dialect') else None)
    except Exception as e:
        logger.warning(f"[/health] DB ping failed: {e}")
        db_ok = False

    # Get last activity timestamp
    last_activity = datetime.now(timezone.utc).isoformat()
    try:
        last_anomaly = (
            db.query(AuditAnomaly)
            .order_by(AuditAnomaly.timestamp.desc())
            .first()
        )
        if last_anomaly and last_anomaly.timestamp:
            last_activity = last_anomaly.timestamp.isoformat() + "Z"
    except Exception as e:
        logger.warning(f"[/health] Failed to fetch last activity: {e}")

    uptime = int(time.time() - _start_time)
    status = "healthy" if db_ok else "degraded"

    return {
        "status": status,
        "service_name": settings.SERVICE_NAME,
        "version": settings.SERVICE_VERSION,
        "uptime_seconds": uptime,
        "last_activity": last_activity,
    }
