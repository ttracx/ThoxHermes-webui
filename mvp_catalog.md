# THOX Hermes MVP Catalog

Priority is calculated on a 1–10 scale:

```text
Priority = (Market Value × 0.4)
         + (Technical Feasibility × 0.3)
         + (Time-to-Market × 0.2)
         + (Strategic Importance × 0.1)
```

## Ranked portfolio

| Rank | MVP | Market | Feasibility | TTM | Strategic | Priority | Status |
|---:|---|---:|---:|---:|---:|---:|---|
| 1 | THOX-branded Hermes extension | 9.0 | 9.0 | 10.0 | 10.0 | **9.30** | Implemented |
| 2 | Device and DigitalHuman gateway | 8.5 | 9.0 | 9.0 | 9.0 | **8.80** | Implemented |
| 3 | API-backed agent registry | 9.0 | 8.0 | 7.0 | 10.0 | **8.40** | Next |
| 4 | Vercel operations control plane | 8.0 | 8.0 | 8.0 | 9.0 | **8.10** | Planned |
| 5 | Device discovery and fleet health | 8.0 | 7.0 | 6.0 | 10.0 | **7.50** | Planned |
| 6 | Native/PWA device wrappers | 8.0 | 7.0 | 6.0 | 8.0 | **7.30** | Planned |
| 7 | MeshStack offline synchronization | 9.0 | 5.5 | 4.0 | 10.0 | **7.05** | Planned |

## MVP-01 — THOX-branded Hermes extension

**Outcome:** The upstream Hermes runtime presents as a THOX.ai product without creating a maintenance-heavy source fork.

**Vertical slice**

- AI: DigitalHuman and specialist activation prompts.
- Backend: Existing authenticated Hermes APIs and `/health` contract.
- Frontend: THOX command center, black/emerald design system, adaptive device profiles.

**Acceptance criteria**

- Upstream sessions, streaming, workspace, terminal, tools, approvals and providers remain intact.
- Branding is limited to visible presentation; protocol identifiers remain unchanged.
- Device modes include Automatic, ThoxNova, ThoxMini, ThoxMini Air, ThoxClip, ThoxKey and ThoxWatch.
- Agent prompts are prepared but not auto-sent by default.
- Keyboard, touch and reduced-motion accessibility are supported.

## MVP-02 — Device and DigitalHuman gateway

**Outcome:** A Vercel-deployable THOX entry surface launches a trusted device endpoint in the correct device and agent context.

**Vertical slice**

- AI: Agent selection and activation context.
- Backend: Direct health probe to the user-selected endpoint; no cloud conversation proxy.
- Frontend: Endpoint management, device selection, agent selection, launch and copy-link flows.

**Acceptance criteria**

- Endpoint is validated as HTTP/HTTPS and credentials embedded in URLs are rejected.
- Endpoint persistence is browser-local only.
- The gateway does not store or proxy messages, memory, files or credentials.
- Launch context is removed from the THOX Hermes browser history after hydration.
- Desktop and mobile layouts are production-responsive.

## MVP-03 — API-backed agent registry

**Outcome:** Replace static prompt maps with signed, versioned DigitalHuman and internal-agent packages.

**Vertical slice**

- AI: System prompt, tools, model policy, memory namespace and safety profile per agent.
- Backend: Authenticated local registry with schema validation and version pinning.
- Frontend: Agent catalog, capabilities, status, version and activation controls.

**Acceptance criteria**

- Registry operates offline from a signed local cache.
- Agent packages expose immutable IDs and semantic versions.
- Activation records agent version, model route and policy version in session metadata.
- Untrusted or invalid packages fail closed.

## MVP-04 — Vercel operations control plane

**Outcome:** Publish gateway releases, documentation and fleet enrollment without hosting private agent execution.

**Vertical slice**

- AI: None required for the base release; optional support assistant later.
- Backend: Enrollment metadata, release manifests and public device-app configuration.
- Frontend: Gateway, release status, setup documentation and secure enrollment handoff.

**Acceptance criteria**

- No model credentials or conversation content are stored.
- Environment-specific deployment promotion is automated.
- Preview deployments are validated before production promotion.
- Security headers, CSP and dependency checks pass.

## MVP-05 — Device discovery and fleet health

**Outcome:** Operators can see THOX nodes, local services, model routes and actionable failures from one authenticated surface.

**Vertical slice**

- AI: Agent-generated diagnosis grounded in structured health evidence.
- Backend: Narrow local fleet-health sidecar and MeshStack discovery adapter.
- Frontend: Node list, health state, route status, resource pressure and remediation actions.

**Acceptance criteria**

- Discovery is bounded to approved networks and MeshStack peers.
- Mutating actions require explicit approval.
- Health evidence is timestamped and source-attributed.
- Offline nodes degrade gracefully without blocking local use.

## MVP-06 — Native/PWA device wrappers

**Outcome:** Each THOX device launches a consistent branded Hermes experience with platform-appropriate controls.

**Acceptance criteria**

- Installable PWA baseline works on supported browsers.
- Native wrappers use the same device-profile contract.
- Local endpoint discovery and authentication are platform-safe.
- Deep links preserve agent/device context without leaking sensitive prompts.

## MVP-07 — MeshStack offline synchronization

**Outcome:** Sessions, agent packages and approved workspace metadata synchronize across intermittently connected THOX devices.

**Acceptance criteria**

- Local writes work without network availability.
- Conflict resolution is deterministic and auditable.
- Sensitive payloads are encrypted in transit and at rest.
- Device revocation and key rotation are supported.
- Synchronization never silently overwrites divergent user work.
