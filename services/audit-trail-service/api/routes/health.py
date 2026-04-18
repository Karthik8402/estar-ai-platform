"""GET /health — Mandatory contract endpoint (no auth)."""

import time
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from db.database import get_db
from db.models import AuditAnomaly
from config.settings import get_settings
from shared_ai.factory import get_ai_provider

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
        bind = db.get_bind()
        with bind.connect() as conn:
            conn.execute(text("SELECT 1"))
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

    # AI readiness check (non-blocking for service health)
    ai_provider = settings.AI_PROVIDER
    ai_ready = False
    ai_status = "not_configured"
    try:
        _ = get_ai_provider()
        ai_ready = True
        ai_status = "ready"
    except Exception as e:
        logger.info("[/health] AI provider not ready: %s", e)
        ai_status = "unavailable"

    return {
        "status": status,
        "service_name": settings.SERVICE_NAME,
        "version": settings.SERVICE_VERSION,
        "uptime_seconds": uptime,
        "last_activity": last_activity,
        "ai_provider": ai_provider,
        "ai_ready": ai_ready,
        "ai_status": ai_status,
    }
