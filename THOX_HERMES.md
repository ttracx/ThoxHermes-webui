# ThoxHermes WebUI — Hermes Agent integration

ThoxHermes WebUI is a fork of **hermes-webui**, which *is* the browser client for the
**Hermes Agent** (Nous Research). The full agent integration — streaming chat, agent
runs, tool/step visibility, sessions, skills, scheduled tasks, workspace browsing,
memory — is inherited and intact. THOX did not re-implement the protocol; it configures
it and points it at the THOX Hermes setup.

## How the wiring works

The server (`server.py` / `bootstrap.py`) connects to a Hermes Agent checkout and its
config. It is **configuration-driven** — no code change is needed because the WebUI
already speaks the agent's protocol:

| Env var | Purpose | THOX value |
|---|---|---|
| `HERMES_WEBUI_AGENT_DIR` | the hermes-agent checkout (has `run_agent.py`) | your local install |
| `HERMES_HOME` | base dir for Hermes state | `~/.hermes` |
| `HERMES_CONFIG_PATH` | agent config (toolsets, model, MCP servers) | `~/.hermes/config.yaml` |
| `HERMES_WEBUI_BOT_NAME` | assistant name in the UI | `THOXY` |
| `HERMES_WEBUI_DEFAULT_MODEL` | model override | provider default (ThoxRoute/Ollama) |

Copy [`.env.thox.example`](.env.thox.example) → `.env` to apply the THOX preset.

## THOX Hermes topology

- **`~/.hermes/config.yaml`** is the THOX Hermes orchestrator config. It registers THOX
  MCP toolsets (`thox-read-access` → the THOX graph, `thox-brain-*` → the ThoxBrain
  vault), so THOXY has THOX's tools the moment the WebUI connects.
- **Device agents** follow the same Hermes pattern THOX ships elsewhere — e.g.
  `thox-q2-agent` exposes a Hermes-style agent over a local HTTP API (`127.0.0.1:8770`,
  `GET /health` + a safe action allow-list) reasoning via Ollama Cloud. The WebUI is the
  cockpit; agents are the compute plane.
- **Local-first / privacy:** default bind is loopback (`127.0.0.1:8787`); nothing leaves
  the machine unless you deliberately expose it (behind TLS + `HERMES_WEBUI_PASSWORD`).

## The client protocol (reference)

The Hermes HTTP API surface (`/api/*` — chat streaming, `/api/sessions`, `/api/skills`,
`/api/kanban/*`, `/api/workspaces`, `/api/settings`, run controls) is documented by the
native iOS client **[ThoxHermex](https://github.com/ttracx/ThoxHermex)** (THOX fork of
`hermex`), kept as the canonical client-protocol reference.
