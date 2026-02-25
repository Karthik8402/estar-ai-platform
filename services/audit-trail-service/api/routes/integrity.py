"""GET /reports/integrity — Integrity check results from Agent 2."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import IntegrityCheck, IntegrityViolation, FactAuditEvent
from sqlalchemy import func

router = APIRouter()


@router.get("/reports/integrity")
def get_integrity(db: Session = Depends(get_db)):
    """Returns integrity check results — score, violations, and checks performed."""

    checks = db.query(IntegrityCheck).order_by(IntegrityCheck.id).all()
    violations = db.query(IntegrityViolation).order_by(IntegrityViolation.timestamp.desc()).all()

    # Compute score from actual check results
    total = len(checks) if checks else 1
    passed_count = sum(1 for c in checks if c.passed)
    score = int((passed_count / total) * 100) if total > 0 else 0

    # entries_verified = total fact_audit_events (the actual source of truth)
    total_events = db.query(func.count(FactAuditEvent.event_id)).scalar() or 0

    # Last check time — most recent integrity check run
    last_check_obj = (
        db.query(IntegrityCheck)
        .order_by(IntegrityCheck.checked_at.desc())
        .first()
    )

    return {
        "integrity_score": score,
        "entries_verified": total_events,
        "violations": [
            {
                "type": v.violation_type,
                "message": v.message,
                "severity": v.severity,
                "user": v.user,
                "action": v.action,
                "timestamp": v.timestamp.isoformat() + "Z" if v.timestamp else None,
            }
            for v in violations
        ],
        "checks": [
            {
                "name": c.check_name,
                "passed": c.passed,
                "detail": c.detail or ("Passed" if c.passed else "Failed"),
            }
            for c in checks
        ],
        "last_check": (
            last_check_obj.checked_at.isoformat() + "Z"
            if last_check_obj and last_check_obj.checked_at
            else None
        ),
    }
