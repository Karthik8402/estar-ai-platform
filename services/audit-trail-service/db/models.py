"""SQLAlchemy ORM models — Snowflake schema for pharmaceutical audit trail.

Tables:
  Dimension tables: dim_role, dim_user, dim_compliance, dim_module,
                    dim_action, dim_session, dim_time
  Fact table:       fact_audit_events
  Operational:      audit_anomalies, integrity_checks, integrity_violations,
                    audit_reports, agent_configs, agent_runs,
                    audit_thresholds, compliance_rule_configs
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean, Column, DateTime, DECIMAL, ForeignKey, Integer,
    String, Text, Float, JSON,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


# ═══════════════════════════════════════════════════════════
# DIMENSION TABLES (Snowflake schema)
# ═══════════════════════════════════════════════════════════

class DimRole(Base):
    __tablename__ = "dim_role"

    role_id = Column(Integer, primary_key=True, autoincrement=True)
    role_name = Column(String(50), nullable=False)
    permissions_json = Column(JSONB, default={})

    users = relationship("DimUser", back_populates="role")


class DimUser(Base):
    __tablename__ = "dim_user"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), nullable=False, unique=True)
    email = Column(String(255))
    role_id = Column(Integer, ForeignKey("dim_role.role_id"))

    role = relationship("DimRole", back_populates="users")
    audit_events = relationship("FactAuditEvent", back_populates="user")


class DimCompliance(Base):
    __tablename__ = "dim_compliance"

    compliance_id = Column(Integer, primary_key=True, autoincrement=True)
    regulation_code = Column(String(50), nullable=False)
    description = Column(Text)

    modules = relationship("DimModule", back_populates="compliance")


class DimModule(Base):
    __tablename__ = "dim_module"

    module_id = Column(Integer, primary_key=True, autoincrement=True)
    module_name = Column(String(100), nullable=False)
    compliance_category_id = Column(Integer, ForeignKey("dim_compliance.compliance_id"))

    compliance = relationship("DimCompliance", back_populates="modules")
    audit_events = relationship("FactAuditEvent", back_populates="module")


class DimAction(Base):
    __tablename__ = "dim_action"

    action_id = Column(Integer, primary_key=True, autoincrement=True)
    action_name = Column(String(100), nullable=False)
    action_category = Column(String(50))
    requires_e_signature = Column(Boolean, default=False)

    audit_events = relationship("FactAuditEvent", back_populates="action")


class DimSession(Base):
    __tablename__ = "dim_session"

    session_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ip_address = Column(String(45))
    device_fingerprint = Column(String(255))
    geo_location = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime, default=datetime.utcnow)

    audit_events = relationship("FactAuditEvent", back_populates="session")


class DimTime(Base):
    __tablename__ = "dim_time"

    time_id = Column(Integer, primary_key=True, autoincrement=True)
    full_timestamp = Column(DateTime, nullable=False)
    year = Column(Integer)
    month = Column(Integer)
    day = Column(Integer)
    hour = Column(Integer)
    minute = Column(Integer)
    day_of_week = Column(String(10))
    is_off_hours = Column(Boolean, default=False)

    audit_events = relationship("FactAuditEvent", back_populates="time_dim")


# ═══════════════════════════════════════════════════════════
# CENTRAL FACT TABLE
# ═══════════════════════════════════════════════════════════

class FactAuditEvent(Base):
    __tablename__ = "fact_audit_events"

    event_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp_id = Column(Integer, ForeignKey("dim_time.time_id"))
    user_id = Column(Integer, ForeignKey("dim_user.user_id"))
    action_id = Column(Integer, ForeignKey("dim_action.action_id"))
    module_id = Column(Integer, ForeignKey("dim_module.module_id"))
    session_id = Column(UUID(as_uuid=True), ForeignKey("dim_session.session_id"))
    risk_score = Column(DECIMAL(5, 2), default=0)
    is_compliant = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    time_dim = relationship("DimTime", back_populates="audit_events")
    user = relationship("DimUser", back_populates="audit_events")
    action = relationship("DimAction", back_populates="audit_events")
    module = relationship("DimModule", back_populates="audit_events")
    session = relationship("DimSession", back_populates="audit_events")


# ═══════════════════════════════════════════════════════════
# OPERATIONAL TABLES (Dashboard-specific)
# ═══════════════════════════════════════════════════════════

class AuditAnomaly(Base):
    """Detected anomalies — powered by AI agents."""
    __tablename__ = "audit_anomalies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String(20), nullable=False, unique=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    anomaly_type = Column(String(30), nullable=False)  # human_error | integrity_fail | unauthorized
    severity = Column(String(10), nullable=False)       # info | warn | error | critical
    message = Column(Text, nullable=False)
    risk_score = Column(Float, default=0)
    ai_confidence = Column(Float, default=0)
    user = Column(String(100))
    session_id = Column(String(50))
    ip_address = Column(String(45))
    raw_payload = Column(JSONB, default={})


class IntegrityCheck(Base):
    """Integrity check results from Agent 2."""
    __tablename__ = "integrity_checks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    check_name = Column(String(100), nullable=False)
    passed = Column(Boolean, default=True)
    detail = Column(String(200))
    checked_at = Column(DateTime, default=datetime.utcnow)


class IntegrityViolation(Base):
    """Individual violations found during integrity checks."""
    __tablename__ = "integrity_violations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    violation_type = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(10), default="warn")
    user = Column(String(100))
    action = Column(String(100))
    timestamp = Column(DateTime, default=datetime.utcnow)


class AuditReport(Base):
    """Generated compliance reports (by Agent 3 / Gemini)."""
    __tablename__ = "audit_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    report_id = Column(String(20), nullable=False, unique=True)
    report_type = Column(String(20), nullable=False)  # daily | weekly | monthly | on-demand
    generated_at = Column(DateTime, default=datetime.utcnow)
    compliance_score = Column(Integer, default=0)
    anomaly_count = Column(Integer, default=0)
    summary_text = Column(Text, default="")


class AgentConfig(Base):
    """Agent configurations and current status."""
    __tablename__ = "agent_configs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    agent_id = Column(String(20), nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    status = Column(String(20), default="idle")  # running | idle | error | stopped
    last_run = Column(DateTime)
    next_run = Column(String(50))
    cycle_seconds = Column(Integer)
    last_result = Column(String(255))
    error_message = Column(Text)


class AuditThreshold(Base):
    """Configurable detection thresholds."""
    __tablename__ = "audit_thresholds"

    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String(100), nullable=False, unique=True)
    value = Column(String(100), nullable=False)
    description = Column(String(255))


class ComplianceRuleConfig(Base):
    """Read-only compliance rule display data."""
    __tablename__ = "compliance_rule_configs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String(100), nullable=False)
    value = Column(String(255), nullable=False)
