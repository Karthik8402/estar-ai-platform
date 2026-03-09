"""Config endpoints — thresholds and compliance rules."""

import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import AuditThreshold, ComplianceRuleConfig

router = APIRouter()
logger = logging.getLogger("audit-trail-service")


class ThresholdUpdate(BaseModel):
    """Body for PUT /config/rules — update thresholds."""
    failed_login_threshold: int | None = None
    bulk_deletion_threshold: int | None = None
    off_hours_start: str | None = None
    off_hours_end: str | None = None
    field_correction_limit: int | None = None
    timestamp_tolerance: int | None = None


@router.get("/config/thresholds")
def get_thresholds(db: Session = Depends(get_db)):
    """Returns detection threshold configuration."""
    try:
        rows = db.query(AuditThreshold).all()
        result = {}
        for r in rows:
            result[r.key] = r.value
        return result

    except Exception as e:
        logger.error(f"[/config/thresholds] Database query failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch thresholds: {str(e)}")


@router.get("/config/rules")
def get_rules(db: Session = Depends(get_db)):
    """Returns compliance rule display data (read-only)."""
    try:
        rows = db.query(ComplianceRuleConfig).all()
        return [{"key": r.key, "value": r.value} for r in rows]

    except Exception as e:
        logger.error(f"[/config/rules] Database query failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch compliance rules: {str(e)}")


@router.put("/config/rules")
def update_thresholds_via_rules(body: ThresholdUpdate, db: Session = Depends(get_db)):
    """Update detection thresholds (legacy endpoint)."""
    return _do_update_thresholds(body, db)


@router.put("/config/thresholds")
def update_thresholds(body: ThresholdUpdate, db: Session = Depends(get_db)):
    """Update detection thresholds."""
    return _do_update_thresholds(body, db)


def _do_update_thresholds(body: ThresholdUpdate, db: Session):
    """Shared logic for threshold update."""
    try:
        updates = body.model_dump(exclude_none=True)

        if not updates:
            return {"message": "No thresholds to update", "updated": []}

        for key, value in updates.items():
            threshold = db.query(AuditThreshold).filter(AuditThreshold.key == key).first()
            if threshold:
                threshold.value = str(value)
            else:
                db.add(AuditThreshold(key=key, value=str(value)))

        db.commit()
        return {"message": "Thresholds updated", "updated": list(updates.keys())}

    except Exception as e:
        db.rollback()
        logger.error(f"[PUT /config] Failed to update thresholds: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update thresholds: {str(e)}")
