# THOX Hermes WebUI — Architecture and Delivery Guide

## Product intent

THOX Hermes is the owner-controlled command fabric for THOX DigitalHumans, internal Hermes agents, local models, device apps, and MeshStack-connected hardware. The implementation preserves upstream Hermes behavior and adds THOX capabilities through a first-party extension, a loopback sidecar, responsive device modes, and a separate Vercel-safe public control-plane surface.

## System boundaries

| Layer | Runs where | Responsibility |
|---|---|---|
| Hermes WebUI core | Owner-controlled device/server | Sessions, SSE streaming, tools, approvals, memory, profiles, voice, workspaces |
| THOX Hermes extension | Same browser origin as WebUI | THOX design system, DigitalHuman roster, agent operations, device fleet, route visibility, device modes |
| THOX local sidecar | `127.0.0.1:17789` | Normalized device/agent telemetry and bounded safe commands |
| THOXCore / ThoxRoute / MeshStack | Local host and THOX devices | Inference, routing, device discovery, model and package synchronization |
| Vercel control plane | Vercel static hosting | Public architecture/deployment surface only; no local sessions, secrets, or device telemetry |

## Security posture

- Local-first and loopback-bound by default.
- No provider keys, model credentials, conversation history, or arbitrary shell access are exposed by the sidecar.
- Sidecar mutations are disabled by default.
- Enabled mutations are restricted to `diagnostics`, `refresh`, and `sync`.
- The sidecar supports Hermes extension proxy `token-v1` authentication.
- The Vercel application is intentionally static and disconnected from private local runtime data.

## Device experience matrix

| Mode | Primary surface | Layout behavior |
|---|---|---|
| Web / desktop | Browser, macOS, Windows, Linux | Full Hermes three-panel UI plus THOX command fabric |
| ThoxNova | 6-inch portrait touch slate | Narrower command shell, touch-first targets, full local operations |
| ThoxMini | USB edge compute companion | Chat-first compact mode, device status, agent launch |
| ThoxMini Air | Wireless edge companion | Compact status and MeshStack route visibility |
| ThoxClip | Mobile accessory companion | Minimal command and context surface |
| ThoxKey | Portable AI workspace | Workspace-first compact shell and portable session access |

## Deployment

Local runtime:

```bash
bash ./thox-start.sh
```

Windows:

```powershell
./thox-start.ps1
```

Static Vercel control plane:

```bash
vercel deploy apps/thox-control-plane
vercel deploy apps/thox-control-plane --prod
```

Do not deploy the stateful Hermes runtime itself to Vercel. Hermes requires local filesystem state, long-lived streaming, local tools, model access, and device connectivity.
