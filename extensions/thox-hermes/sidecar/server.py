#!/usr/bin/env python3
"""Local THOX Hermes device and agent status sidecar.

The service is deliberately loopback-only, dependency-free, and read-mostly. It
provides normalized telemetry for the THOX Hermes WebUI extension without
exposing provider credentials or granting arbitrary shell execution.
"""

from __future__ import annotations

import argparse
import json
import os
import secrets
import signal
import sys
import threading
import time
from dataclasses import asdict, dataclass
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

HOST = "127.0.0.1"
DEFAULT_PORT = 17789
SAFE_COMMANDS = frozenset({"diagnostics", "refresh", "sync"})
STATE_LOCK = threading.RLock()
STARTED_AT = time.time()


@dataclass
class RuntimeState:
    status: str = "online"
    version: str = "0.1.0"
    route: str = "THOX local sidecar"
    started_at: float = STARTED_AT


DEFAULT_STATE: dict[str, Any] = {
    "organization": "THOX.ai",
    "runtime": asdict(RuntimeState()),
    "digital_humans": [
        {
            "id": "sadie-weaving",
            "name": "Sadie Weaving",
            "role": "THOX Hermes Chief Agentic Officer",
            "status": "ready",
            "model": "ThoxRoute",
        }
    ],
    "internal_agents": [
        {"id": "orchestrator", "name": "Hermes Orchestrator", "domain": "coordination", "status": "ready"},
        {"id": "research", "name": "Research Agent", "domain": "research", "status": "ready"},
        {"id": "builder", "name": "Builder Agent", "domain": "implementation", "status": "ready"},
        {"id": "reviewer", "name": "Review Agent", "domain": "quality and safety", "status": "ready"},
    ],
    "devices": [
        {"id": "thoxnova", "name": "ThoxNova", "class": "edge AI slate", "status": "unpaired", "channel": "local"},
        {"id": "thoxmini", "name": "ThoxMini", "class": "USB edge compute", "status": "unpaired", "channel": "USB-NCM"},
        {"id": "thoxmini-air", "name": "ThoxAir", "class": "wireless edge assistant", "status": "unpaired", "channel": "Wi-Fi / BLE"},
        {"id": "thoxclip", "name": "ThoxClip", "class": "MagSafe / Qi2 edge accessory", "status": "unpaired", "channel": "BLE"},
        {"id": "thoxkey", "name": "ThoxKey", "class": "portable AI workspace", "status": "unpaired", "channel": "USB"},
        {"id": "thoxwatch", "name": "ThoxWatch", "class": "wearable companion", "status": "unpaired", "channel": "BLE"},
        {"id": "thoxvault", "name": "ThoxVault", "class": "wireless private storage", "status": "unpaired", "channel": "Wi-Fi / USB"},
    ],
    "routes": [
        {"id": "local", "name": "Local inference", "status": "unknown", "provider": "THOXCore / llama.cpp / Ollama"},
        {"id": "mesh", "name": "MeshStack", "status": "unknown", "provider": "device mesh"},
        {"id": "fallback", "name": "Cloud fallback", "status": "unknown", "provider": "configured provider"},
    ],
    "alerts": [],
}


def _state_file() -> Path:
    configured = os.getenv("THOX_HERMES_STATE_FILE", "").strip()
    if configured:
        return Path(configured).expanduser()
    base = Path(os.getenv("HERMES_WEBUI_STATE_DIR", Path.home() / ".hermes" / "webui"))
    return base / "thox-hermes-sidecar.json"


def _token_file() -> Path | None:
    configured = os.getenv("HERMES_EXT_SIDECAR_TOKEN_FILE", "").strip()
    if configured:
        return Path(configured).expanduser()
    state_dir = Path(os.getenv("HERMES_WEBUI_STATE_DIR", Path.home() / ".hermes" / "webui"))
    candidate = state_dir / "sidecar-auth" / "thox-hermes.token"
    return candidate if candidate.exists() else None


def _load_state() -> dict[str, Any]:
    with STATE_LOCK:
        path = _state_file()
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
        except FileNotFoundError:
            return json.loads(json.dumps(DEFAULT_STATE))
        except (OSError, json.JSONDecodeError) as exc:
            state = json.loads(json.dumps(DEFAULT_STATE))
            state["alerts"] = [{"severity": "warning", "message": f"State file could not be loaded: {type(exc).__name__}"}]
            return state
        if not isinstance(raw, dict):
            return json.loads(json.dumps(DEFAULT_STATE))
        merged = json.loads(json.dumps(DEFAULT_STATE))
        merged.update(raw)
        merged["runtime"] = {**DEFAULT_STATE["runtime"], **(raw.get("runtime") or {})}
        return merged


def _save_state(state: dict[str, Any]) -> None:
    with STATE_LOCK:
        path = _state_file()
        path.parent.mkdir(parents=True, exist_ok=True)
        temp = path.with_suffix(path.suffix + f".{secrets.token_hex(4)}.tmp")
        temp.write_text(json.dumps(state, indent=2, sort_keys=True), encoding="utf-8")
        os.chmod(temp, 0o600)
        temp.replace(path)


def _read_proxy_token() -> str | None:
    path = _token_file()
    if path is None:
        return None
    try:
        return path.read_text(encoding="utf-8").strip()
    except OSError:
        return None


def _allowed_origin(origin: str | None) -> str | None:
    if not origin:
        return None
    parsed = urlparse(origin)
    if parsed.hostname in {"127.0.0.1", "localhost", "::1"} and parsed.scheme in {"http", "https"}:
        return origin
    explicit = {value.strip() for value in os.getenv("THOX_HERMES_ALLOWED_ORIGINS", "").split(",") if value.strip()}
    return origin if origin in explicit else None


class Handler(BaseHTTPRequestHandler):
    server_version = "THOXHermesSidecar/0.1"

    def log_message(self, fmt: str, *args: Any) -> None:
        sys.stderr.write("[thox-sidecar] " + (fmt % args) + "\n")

    def _cors_headers(self) -> None:
        allowed = _allowed_origin(self.headers.get("Origin"))
        if allowed:
            self.send_header("Access-Control-Allow-Origin", allowed)
            self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Hermes-Sidecar-Token")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")

    def _json(self, status: int, payload: dict[str, Any]) -> None:
        encoded = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self._cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def _authorized_mutation(self) -> bool:
        if os.getenv("THOX_HERMES_ALLOW_COMMANDS", "0") != "1":
            return False
        expected = _read_proxy_token()
        if expected is None:
            return os.getenv("THOX_HERMES_ALLOW_UNAUTHENTICATED_COMMANDS", "0") == "1"
        provided = self.headers.get("X-Hermes-Sidecar-Token", "")
        return secrets.compare_digest(provided, expected)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(HTTPStatus.NO_CONTENT)
        self._cors_headers()
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path == "/health":
            self._json(HTTPStatus.OK, {"ok": True, "service": "thox-hermes-sidecar", "uptime_seconds": int(time.time() - STARTED_AT)})
            return
        if path == "/api/overview":
            state = _load_state()
            state["runtime"] = {**state.get("runtime", {}), "status": "online", "uptime_seconds": int(time.time() - STARTED_AT)}
            self._json(HTTPStatus.OK, state)
            return
        if path == "/api/devices":
            self._json(HTTPStatus.OK, {"devices": _load_state().get("devices", [])})
            return
        self._json(HTTPStatus.NOT_FOUND, {"error": "not_found"})

    def do_POST(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        parts = [part for part in parsed.path.split("/") if part]
        if len(parts) == 4 and parts[0] == "api" and parts[1] == "devices" and parts[3] == "commands":
            if not self._authorized_mutation():
                self._json(HTTPStatus.FORBIDDEN, {"error": "commands_disabled", "message": "Enable authenticated safe commands in the sidecar environment."})
                return
            try:
                length = min(int(self.headers.get("Content-Length", "0")), 16_384)
                body = json.loads(self.rfile.read(length) or b"{}")
            except (ValueError, json.JSONDecodeError):
                self._json(HTTPStatus.BAD_REQUEST, {"error": "invalid_json"})
                return
            command = str(body.get("command", ""))
            if command not in SAFE_COMMANDS:
                self._json(HTTPStatus.BAD_REQUEST, {"error": "unsupported_command"})
                return
            device_id = parts[2]
            state = _load_state()
            device = next((item for item in state.get("devices", []) if str(item.get("id")) == device_id), None)
            if device is None:
                self._json(HTTPStatus.NOT_FOUND, {"error": "device_not_found"})
                return
            device["last_command"] = command
            device["last_command_at"] = int(time.time())
            _save_state(state)
            self._json(HTTPStatus.ACCEPTED, {"ok": True, "device_id": device_id, "command": command, "status": "accepted"})
            return
        self._json(HTTPStatus.NOT_FOUND, {"error": "not_found"})


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the local THOX Hermes status sidecar")
    parser.add_argument("--host", default=HOST, choices=["127.0.0.1", "localhost"], help="Loopback bind host")
    parser.add_argument("--port", type=int, default=int(os.getenv("THOX_HERMES_SIDECAR_PORT", DEFAULT_PORT)))
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.host, args.port), Handler)
    server.daemon_threads = True

    def stop(_signum: int, _frame: Any) -> None:
        threading.Thread(target=server.shutdown, daemon=True).start()

    signal.signal(signal.SIGINT, stop)
    signal.signal(signal.SIGTERM, stop)
    print(f"THOX Hermes sidecar listening on http://{args.host}:{args.port}", flush=True)
    try:
        server.serve_forever(poll_interval=0.25)
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
