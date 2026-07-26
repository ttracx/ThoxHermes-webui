"""Contract tests for the THOX Hermes product layer.

These tests intentionally avoid importing the Hermes runtime so they can run as a
fast merge gate in constrained CI environments.
"""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EXTENSION = ROOT / "thox" / "extensions" / "thox-hermes"
GATEWAY = ROOT / "thox" / "vercel"


def _read(path: Path) -> str:
    assert path.is_file(), f"Required THOX asset is missing: {path.relative_to(ROOT)}"
    return path.read_text(encoding="utf-8")


def test_required_thox_assets_exist() -> None:
    required = [
        EXTENSION / "manifest.json",
        EXTENSION / "thox-brand.css",
        EXTENSION / "thox-app.js",
        EXTENSION / "thox-launch-context.js",
        EXTENSION / "assets" / "thox-mark.svg",
        EXTENSION / "assets" / "manifest.webmanifest",
        ROOT / "thox" / "start-thox.sh",
        ROOT / "thox" / "start-thox.ps1",
        ROOT / "thox" / "docker-compose.override.yml",
        GATEWAY / "index.html",
        GATEWAY / "styles.css",
        GATEWAY / "app.js",
        GATEWAY / "build.mjs",
        GATEWAY / "package.json",
        GATEWAY / "vercel.json",
        ROOT / "ecosystem_map.md",
        ROOT / "mvp_catalog.md",
        ROOT / "development_queue.md",
    ]
    missing = [str(path.relative_to(ROOT)) for path in required if not path.is_file()]
    assert not missing, f"Missing THOX assets: {missing}"


def test_extension_manifest_is_local_and_complete() -> None:
    manifest = json.loads(_read(EXTENSION / "manifest.json"))
    assert manifest["id"] == "thox-hermes-suite"
    assert manifest["name"] == "THOX Hermes Suite"
    assert manifest["permissions"] == {"storage": {"owned": True}}
    assert manifest["scripts"] == ["thox-app.js", "thox-launch-context.js"]

    assets = [*manifest["scripts"], *manifest["stylesheets"]]
    assert assets
    for asset in assets:
        assert not re.match(r"^[a-z][a-z0-9+.-]*:", asset, flags=re.IGNORECASE)
        assert ".." not in Path(asset).parts
        assert (EXTENSION / asset).is_file(), f"Manifest asset does not exist: {asset}"

    schemas = {item["key"]: item for item in manifest["settings_schema"]}
    assert schemas["device_profile"]["default"] == "auto"
    assert schemas["show_launcher"]["default"] is True
    assert schemas["agent_autosend"]["default"] is False

    profile_values = {item["value"] for item in schemas["device_profile"]["options"]}
    assert profile_values == {"auto", "nova", "mini", "mini-air", "clip", "key", "watch"}


def test_thox_brand_contract_and_safe_defaults() -> None:
    css = _read(EXTENSION / "thox-brand.css")
    script = _read(EXTENSION / "thox-app.js")
    launch_context = _read(EXTENSION / "thox-launch-context.js")

    for token in ("#050806", "#10b981", "#00ff88", "Inter", "JetBrains Mono"):
        assert token in css

    for agent_id in (
        "sadie-weaving",
        "internal-orchestrator",
        "device-engineer",
        "platform-engineer",
        "customer-experience",
        "security-reviewer",
    ):
        assert agent_id in script

    assert 'getSetting("agent_autosend", false)' in script
    assert 'querySelector("#appTitlebarTitle")' in script
    assert "MutationObserver" not in script, "Branding must not rewrite dynamic conversation content"
    assert "createTreeWalker" not in script, "Branding must remain scoped to known chrome nodes"
    assert "X-Hermes-CSRF-Token" not in script, "Extension must not replace core CSRF behavior"
    assert "localStorage.clear" not in script
    assert "eval(" not in script
    assert "new Function" not in script
    assert 'params.get("source") !== "thox-device-gateway"' in launch_context
    assert "history.replaceState" in launch_context


def test_gateway_is_static_local_first_and_rejects_url_credentials() -> None:
    app = _read(GATEWAY / "app.js")
    html = _read(GATEWAY / "index.html")
    config = json.loads(_read(GATEWAY / "vercel.json"))
    package = json.loads(_read(GATEWAY / "package.json"))

    assert "localStorage" in app
    assert "url.username || url.password" in app
    assert "Only HTTP and HTTPS endpoints are supported" in app
    assert 'source: "thox-device-gateway"' in app
    assert "fetch(healthUrl" in app
    assert "proxy" not in app.lower(), "Gateway must not implement a conversation proxy"
    assert "Your AI. Your Data. Your Rules." in html

    headers = {
        header["key"].lower(): header["value"]
        for rule in config["headers"]
        for header in rule["headers"]
    }
    assert headers["x-content-type-options"] == "nosniff"
    assert "default-src 'self'" in headers["content-security-policy"]
    assert "'unsafe-eval'" not in headers["content-security-policy"]
    assert "'unsafe-inline'" not in headers["content-security-policy"]
    assert package["scripts"]["build"] == "node build.mjs"
    assert "node --check" in package["scripts"]["test"]


def test_living_documents_include_required_priority_formula() -> None:
    catalog = _read(ROOT / "mvp_catalog.md")
    queue = _read(ROOT / "development_queue.md")
    ecosystem = _read(ROOT / "ecosystem_map.md")

    assert "Market Value × 0.4" in catalog
    assert "Technical Feasibility × 0.3" in catalog
    assert "Time-to-Market × 0.2" in catalog
    assert "Strategic Importance × 0.1" in catalog
    assert "THXH-010" in queue
    assert "Vercel Device Gateway" in ecosystem
    assert "Trusted THOX Device" in ecosystem
