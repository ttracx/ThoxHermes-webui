# THOX Hermes

THOX Hermes is the THOX.ai product layer for Hermes WebUI. It provides:

- THOX.ai black and emerald branding.
- Adaptive experiences for ThoxNova, ThoxMini, ThoxMini Air, ThoxClip, ThoxKey and ThoxWatch.
- A command center for Sadie Weaving and THOX internal specialist agents.
- Cross-platform local launchers.
- A Docker Compose overlay.
- A Vercel-deployable device gateway that never proxies private agent traffic.

## Architecture choice

The THOX product layer uses the supported Hermes WebUI extension contract instead of rewriting the upstream application. This keeps the fork easier to update and preserves existing sessions, streaming, workspace, terminal, tools, approvals, providers and local memory.

The extension runs with the authenticated browser session. Treat it as trusted application code and review every change before deployment.

## Local launch

### Linux, macOS and WSL

```bash
chmod +x thox/start-thox.sh
./thox/start-thox.sh
```

Pass any supported `bootstrap.py` arguments after the launcher:

```bash
./thox/start-thox.sh --no-browser
```

Default address:

```text
http://127.0.0.1:8787
```

To expose the service on an approved network interface, set the host explicitly and configure authentication:

```bash
HERMES_WEBUI_HOST=0.0.0.0 \
HERMES_WEBUI_PASSWORD='replace-with-a-strong-secret' \
./thox/start-thox.sh --no-browser
```

### Native Windows PowerShell

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\thox\start-thox.ps1
```

Forward bootstrap arguments when needed:

```powershell
.\thox\start-thox.ps1 --no-browser
```

### Docker Compose

Use the upstream compose file with the THOX overlay:

```bash
docker compose \
  -f docker-compose.yml \
  -f thox/docker-compose.override.yml \
  up -d --build
```

The overlay mounts `thox/extensions` read-only and configures the supported extension manifest environment variables.

## Command center

Open the THOX Command Center with the floating THOX mark or:

```text
Ctrl/Command + Shift + K
```

Available launch profiles:

- Sadie Weaving — executive DigitalHuman and Chief Agentic Officer.
- Agent Orchestrator — parallel workstream routing and handoffs.
- Device Engineer — hardware, CAD, firmware, printing and validation.
- Platform Engineer — THOXCore, ThoxRoute, MeshStack and local inference.
- Experience Fabric — customer experience, support, content and UX learning.
- Security Reviewer — local-first security review and remediation.

Agent activation prompts are inserted into the composer. Auto-send is disabled by default and can be changed through the extension setting.

## Device profiles

Select a profile in the THOX Command Center or open a deep link:

```text
http://127.0.0.1:8787/?device=nova
http://127.0.0.1:8787/?device=mini
http://127.0.0.1:8787/?device=mini-air
http://127.0.0.1:8787/?device=clip
http://127.0.0.1:8787/?device=key
http://127.0.0.1:8787/?device=watch
```

`device=auto` selects a profile based on viewport and screen size.

## Vercel device gateway

The gateway is a separate static project under `thox/vercel`. It stores a trusted THOX Hermes endpoint in that browser only, lets the user select a device profile and agent, and opens the device-hosted runtime directly.

It does **not**:

- Host the Hermes agent runtime.
- Store conversations, memory, files or model credentials.
- Proxy private messages through Vercel.
- Bypass authentication on the device endpoint.

### Local gateway development

```bash
cd thox/vercel
npm test
npm run build
npx serve dist
```

### Vercel import settings

Use these project values:

```text
Root Directory: thox/vercel
Framework Preset: Other
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Node.js: 20 or newer
```

No environment variables are required for the static gateway MVP.

## Secure remote access

A device endpoint exposed beyond loopback should use:

- HTTPS.
- Hermes WebUI authentication.
- A trusted private network, reverse proxy or device-specific domain.
- Restrictive firewall and origin policy.
- A CORS policy that permits the approved gateway origin only when browser health probing is desired.

The gateway can still launch an endpoint when its health probe is blocked by CORS; the device endpoint remains responsible for authentication.

## Validation

Run the THOX-specific checks from the repository root:

```bash
python -m pytest thox/tests/test_thox_suite.py -q
cd thox/vercel && npm test && npm run build
```

The validation suite checks required files, manifest safety, local-only gateway behavior, security headers and JavaScript syntax without starting the upstream test server.

## Living architecture documents

- [`ecosystem_map.md`](../ecosystem_map.md)
- [`mvp_catalog.md`](../mvp_catalog.md)
- [`development_queue.md`](../development_queue.md)
