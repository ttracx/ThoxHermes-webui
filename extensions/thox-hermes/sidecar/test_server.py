from __future__ import annotations

import importlib.util
import json
import os
import sys
import tempfile
import threading
import unittest
from http.client import HTTPConnection
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("server.py")
SPEC = importlib.util.spec_from_file_location("thox_sidecar", MODULE_PATH)
assert SPEC and SPEC.loader
sidecar = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = sidecar
SPEC.loader.exec_module(sidecar)


class SidecarTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        os.environ["THOX_HERMES_STATE_FILE"] = str(Path(self.temp.name) / "state.json")
        os.environ.pop("THOX_HERMES_ALLOW_COMMANDS", None)
        self.server = sidecar.ThreadingHTTPServer(("127.0.0.1", 0), sidecar.Handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.host, self.port = self.server.server_address

    def tearDown(self) -> None:
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        self.temp.cleanup()

    def request(self, method: str, path: str, body: dict | None = None):
        connection = HTTPConnection(self.host, self.port, timeout=2)
        payload = json.dumps(body).encode() if body is not None else None
        headers = {"Content-Type": "application/json"} if body is not None else {}
        connection.request(method, path, body=payload, headers=headers)
        response = connection.getresponse()
        data = json.loads(response.read() or b"{}")
        connection.close()
        return response.status, data

    def test_health(self) -> None:
        status, payload = self.request("GET", "/health")
        self.assertEqual(status, 200)
        self.assertTrue(payload["ok"])

    def test_overview_contains_core_collections(self) -> None:
        status, payload = self.request("GET", "/api/overview")
        self.assertEqual(status, 200)
        self.assertIn("digital_humans", payload)
        self.assertIn("internal_agents", payload)
        self.assertIn("devices", payload)
        self.assertEqual(payload["runtime"]["status"], "online")

    def test_commands_fail_closed(self) -> None:
        status, payload = self.request("POST", "/api/devices/thoxnova/commands", {"command": "diagnostics"})
        self.assertEqual(status, 403)
        self.assertEqual(payload["error"], "commands_disabled")

    def test_unsupported_route(self) -> None:
        status, payload = self.request("GET", "/missing")
        self.assertEqual(status, 404)
        self.assertEqual(payload["error"], "not_found")


if __name__ == "__main__":
    unittest.main()
