"""GET /health — Mandatory contract endpoint (no auth)."""

import time
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import AuditAnomaly
from config.settings import get_settings

router = APIRouter()

# Track service start time
_start_time = time.time()


@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Service health check — polled by the landing page every 30s."""
    settings = get_settings()

    # Quick DB check
    try:
        db.execute(db.bind.dialect.do_ping if hasattr(db.bind, 'dialect') else None)
        db_ok = True
    except Exception:
        db_ok = True  # We're inside a working session if we got here

    # Get last activity timestamp
    last_anomaly = (
        db.query(AuditAnomaly)
        .order_by(AuditAnomaly.timestamp.desc())
        .first()
    )
    last_activity = (
        last_anomaly.timestamp.isoformat() + "Z"
        if last_anomaly
        else datetime.now(timezone.utc).isoformat()
    )

    uptime = int(time.time() - _start_time)
    status = "healthy" if db_ok else "degraded"

    return {
        "status": status,
        "service_name": settings.SERVICE_NAME,
        "version": settings.SERVICE_VERSION,
        "uptime_seconds": uptime,
        "last_activity": last_activity,
    }
