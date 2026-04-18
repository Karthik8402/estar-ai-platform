import os
import unittest

os.environ["AUTO_CREATE_TABLES"] = "false"
os.environ["ENABLE_SCHEDULER"] = "false"

from fastapi.testclient import TestClient

from api.main import app
from api.routes.config_routes import _coerce_threshold_value


class ApiContractTests(unittest.TestCase):
    def test_root_returns_service_metadata_and_trace_header(self):
        with TestClient(app) as client:
            response = client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["service"], "audit-trail-service")
        self.assertIn("X-Request-ID", response.headers)
        self.assertIn("X-Process-Time-Ms", response.headers)

    def test_validation_errors_are_structured(self):
        with TestClient(app) as client:
            response = client.post("/agents/start", json={"agent_id": "bad id"})

        body = response.json()
        self.assertEqual(response.status_code, 422)
        self.assertEqual(body["error"], "validation_error")
        self.assertEqual(body["detail"], "Request validation failed.")
        self.assertIn("request_id", body)
        self.assertIn("errors", body)

    def test_threshold_update_rejects_unknown_keys(self):
        with TestClient(app) as client:
            response = client.put("/config/thresholds", json={"unknown_threshold": 10})

        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()["error"], "validation_error")

    def test_threshold_update_rejects_invalid_time_format(self):
        with TestClient(app) as client:
            response = client.put("/config/thresholds", json={"off_hours_start": "25:99"})

        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()["error"], "validation_error")

    def test_threshold_values_are_coerced_for_api_consumers(self):
        self.assertEqual(_coerce_threshold_value("failed_login_threshold", "3"), 3)
        self.assertIs(_coerce_threshold_value("self_approval_enabled", "false"), False)
        self.assertEqual(_coerce_threshold_value("missing_reason_severity", "error"), "error")


if __name__ == "__main__":
    unittest.main()
