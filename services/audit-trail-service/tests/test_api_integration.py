import os
import unittest
from datetime import datetime, timezone

os.environ["AUTO_CREATE_TABLES"] = "false"
os.environ["ENABLE_SCHEDULER"] = "false"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from api.main import app
from db.database import get_db
from db.models import (
    AgentConfig,
    AuditAnomaly,
    AuditReport,
    AuditThreshold,
    Base,
    ComplianceRuleConfig,
    FactAuditEvent,
    IntegrityCheck,
    IntegrityViolation,
)


class ApiIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        cls.SessionTesting = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)

        def override_get_db():
            db = cls.SessionTesting()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.pop(get_db, None)
        cls.engine.dispose()

    def setUp(self):
        Base.metadata.drop_all(bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
        self._seed_database()

    def _seed_database(self):
        db = self.SessionTesting()
        now = datetime.now(timezone.utc)
        try:
            db.add_all([
                FactAuditEvent(is_compliant=True),
                FactAuditEvent(is_compliant=False),
                AuditAnomaly(
                    event_id="evt_001",
                    timestamp=now,
                    anomaly_type="human_error",
                    severity="error",
                    message="Missing correction reason for stability result update",
                    risk_score=72.5,
                    ai_confidence=0.91,
                    user="analyst3",
                    session_id="ses_001",
                    ip_address="10.0.0.4",
                    raw_payload={"pattern": "missing_reason"},
                ),
                AuditAnomaly(
                    event_id="evt_002",
                    timestamp=now,
                    anomaly_type="unauthorized",
                    severity="warn",
                    message="Off-hours access to audit records",
                    risk_score=44.0,
                    ai_confidence=0.78,
                    user="operator_k",
                    session_id="ses_002",
                    ip_address="10.0.0.8",
                    raw_payload={"pattern": "off_hours"},
                ),
                IntegrityCheck(check_name="Electronic signatures", passed=True, detail="All required signatures present"),
                IntegrityCheck(check_name="RBAC validation", passed=False, detail="1 RBAC warning"),
                IntegrityViolation(
                    violation_type="rbac_violation",
                    message="User attempted admin action outside assigned role",
                    severity="error",
                    user="analyst3",
                    action="admin_config",
                    timestamp=now,
                ),
                AuditReport(
                    report_id="rpt_001",
                    report_type="daily",
                    generated_at=now,
                    compliance_score=88,
                    anomaly_count=2,
                    summary_text="EXECUTIVE SUMMARY\nDaily compliance snapshot is stable.",
                ),
                AgentConfig(
                    agent_id="agent_1",
                    name="Human Error Detection",
                    description="Detects human error patterns",
                    status="running",
                    last_run=now,
                    next_run="scheduled",
                    cycle_seconds=300,
                    last_result="2 anomalies detected",
                ),
                AuditThreshold(key="failed_login_threshold", value="3"),
                AuditThreshold(key="self_approval_enabled", value="false"),
                AuditThreshold(key="off_hours_start", value="22:00"),
                ComplianceRuleConfig(key="21 CFR Part 11.10(e)", value="Audit trails must be secure and timestamped."),
            ])
            db.commit()
        finally:
            db.close()

    def test_contract_routes_return_seeded_data(self):
        with TestClient(app) as client:
            summary = client.get("/summary")
            activity = client.get("/activity/recent?limit=1")

        self.assertEqual(summary.status_code, 200)
        self.assertEqual(summary.json()["total_processed"], 2)
        self.assertEqual(summary.json()["quick_stats"]["anomalies_flagged"], 2)

        self.assertEqual(activity.status_code, 200)
        self.assertEqual(len(activity.json()["items"]), 1)
        self.assertEqual(activity.json()["items"][0]["service"], "audit-trail")

    def test_dashboard_routes_return_paginated_and_typed_data(self):
        with TestClient(app) as client:
            anomalies = client.get("/reports/anomalies?severity=error&page=1&limit=10")
            integrity = client.get("/reports/integrity")
            reports = client.get("/reports/summary")
            thresholds = client.get("/config/thresholds")
            agents = client.get("/agents/status")

        self.assertEqual(anomalies.status_code, 200)
        self.assertEqual(anomalies.json()["total"], 1)
        self.assertEqual(anomalies.json()["items"][0]["event_id"], "evt_001")

        self.assertEqual(integrity.status_code, 200)
        self.assertEqual(integrity.json()["integrity_score"], 50)
        self.assertEqual(len(integrity.json()["violations"]), 1)

        self.assertEqual(reports.status_code, 200)
        self.assertEqual(reports.json()[0]["report_id"], "rpt_001")

        self.assertEqual(thresholds.status_code, 200)
        self.assertEqual(thresholds.json()["failed_login_threshold"], 3)
        self.assertIs(thresholds.json()["self_approval_enabled"], False)

        self.assertEqual(agents.status_code, 200)
        self.assertEqual(agents.json()[0]["agent_id"], "agent_1")

    def test_threshold_updates_persist_through_api(self):
        with TestClient(app) as client:
            update = client.put(
                "/config/thresholds",
                json={
                    "failed_login_threshold": 5,
                    "self_approval_enabled": True,
                    "off_hours_start": "21:30",
                },
            )
            thresholds = client.get("/config/thresholds")

        self.assertEqual(update.status_code, 200)
        self.assertEqual(set(update.json()["updated"]), {"failed_login_threshold", "self_approval_enabled", "off_hours_start"})
        self.assertEqual(thresholds.json()["failed_login_threshold"], 5)
        self.assertIs(thresholds.json()["self_approval_enabled"], True)
        self.assertEqual(thresholds.json()["off_hours_start"], "21:30")


if __name__ == "__main__":
    unittest.main()
