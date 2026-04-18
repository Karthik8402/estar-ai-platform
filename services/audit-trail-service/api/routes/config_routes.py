"""Config endpoints for thresholds and compliance rules."""

import logging
import re
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import AuditThreshold, ComplianceRuleConfig

router = APIRouter()
logger = logging.getLogger("audit-trail-service")

Severity = Literal["info", "warn", "error", "critical"]

NUMERIC_THRESHOLD_KEYS = {
    "failed_login_threshold",
    "bulk_deletion_threshold",
    "field_correction_limit",
    "timestamp_tolerance",
    "late_pull_days_threshold",
    "concurrent_session_window",
    "backdated_entry_days",
}
BOOLEAN_THRESHOLD_KEYS = {"self_approval_enabled"}
TIME_PATTERN = re.compile(r"^(?:[01]\d|2[0-3]):[0-5]\d$")


class ThresholdUpdate(BaseModel):
    """Body for threshold updates."""

    model_config = ConfigDict(extra="forbid")

    failed_login_threshold: int | None = Field(default=None, ge=1, le=100)
    bulk_deletion_threshold: int | None = Field(default=None, ge=1, le=10_000)
    off_hours_start: str | None = None
    off_hours_end: str | None = None
    field_correction_limit: int | None = Field(default=None, ge=1, le=1_000)
    timestamp_tolerance: int | None = Field(default=None, ge=0, le=86_400)
    late_pull_days_threshold: int | None = Field(default=None, ge=0, le=365)
    self_approval_enabled: bool | None = None
    concurrent_session_window: int | None = Field(default=None, ge=1, le=1_440)
    missing_reason_severity: Severity | None = None
    oos_override_severity: Severity | None = None
    backdated_entry_days: int | None = Field(default=None, ge=0, le=365)

    @field_validator("off_hours_start", "off_hours_end")
    @classmethod
    def validate_time(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if not TIME_PATTERN.match(value):
            raise ValueError("Time must use 24-hour HH:MM format.")
        return value


@router.get("/config/thresholds")
def get_thresholds(db: Session = Depends(get_db)) -> dict[str, Any]:
    """Return detection threshold configuration with API-friendly value types."""
    try:
        rows = db.query(AuditThreshold).all()
        return {row.key: _coerce_threshold_value(row.key, row.value) for row in rows}

    except Exception as e:
        logger.error("[/config/thresholds] Database query failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch thresholds.")


@router.get("/config/rules")
def get_rules(db: Session = Depends(get_db)) -> list[dict[str, str]]:
    """Return compliance rule display data."""
    try:
        rows = db.query(ComplianceRuleConfig).all()
        return [{"key": row.key, "value": row.value} for row in rows]

    except Exception as e:
        logger.error("[/config/rules] Database query failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch compliance rules.")


@router.put("/config/rules")
def update_thresholds_via_rules(body: ThresholdUpdate, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Update detection thresholds via the legacy endpoint."""
    return _do_update_thresholds(body, db)


@router.put("/config/thresholds")
def update_thresholds(body: ThresholdUpdate, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Update detection thresholds."""
    return _do_update_thresholds(body, db)


def _do_update_thresholds(body: ThresholdUpdate, db: Session) -> dict[str, Any]:
    """Shared threshold update logic."""
    try:
        updates = body.model_dump(exclude_none=True)

        if not updates:
            return {"message": "No thresholds to update", "updated": []}

        for key, value in updates.items():
            serialized = _serialize_threshold_value(value)
            threshold = db.query(AuditThreshold).filter(AuditThreshold.key == key).first()
            if threshold:
                threshold.value = serialized
            else:
                db.add(AuditThreshold(key=key, value=serialized))

        db.commit()
        return {
            "message": "Thresholds updated",
            "updated": list(updates.keys()),
            "thresholds": {key: _coerce_threshold_value(key, _serialize_threshold_value(value)) for key, value in updates.items()},
        }

    except Exception as e:
        db.rollback()
        logger.error("[PUT /config] Failed to update thresholds: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update thresholds.")


def _serialize_threshold_value(value: Any) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value)


def _coerce_threshold_value(key: str, value: str) -> Any:
    if key in NUMERIC_THRESHOLD_KEYS:
        try:
            return int(value)
        except (TypeError, ValueError):
            logger.warning("Threshold %s has non-numeric value %r", key, value)
            return value

    if key in BOOLEAN_THRESHOLD_KEYS:
        normalized = str(value).strip().lower()
        if normalized in {"true", "1", "yes", "on"}:
            return True
        if normalized in {"false", "0", "no", "off"}:
            return False

    return value
