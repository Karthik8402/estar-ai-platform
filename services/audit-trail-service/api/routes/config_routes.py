"""Config endpoints — thresholds and compliance rules."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import AuditThreshold, ComplianceRuleConfig

router = APIRouter()


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

    rows = db.query(AuditThreshold).all()
    result = {}
    for r in rows:
        result[r.key] = r.value
    return result


@router.get("/config/rules")
def get_rules(db: Session = Depends(get_db)):
    """Returns compliance rule display data (read-only)."""

    rows = db.query(ComplianceRuleConfig).all()
    return [{"key": r.key, "value": r.value} for r in rows]


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
    updates = body.model_dump(exclude_none=True)

    for key, value in updates.items():
        threshold = db.query(AuditThreshold).filter(AuditThreshold.key == key).first()
        if threshold:
            threshold.value = str(value)
        else:
            db.add(AuditThreshold(key=key, value=str(value)))

    db.commit()
    return {"message": "Thresholds updated", "updated": list(updates.keys())}
