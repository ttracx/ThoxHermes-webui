# THOX Hermes Development Queue

**Branch in progress:** `feat/thox-ai-digitalhuman-suite`  
**Release target:** `v1.0.0-thox.1`  
**Queue policy:** Deliver complete vertical slices; preserve upstream mergeability; require tests and security review for every mutation surface.

## Completed in this delivery

| ID | Work item | Slice | Evidence |
|---|---|---|---|
| THXH-001 | Establish canonical THOX fork delivery branch | Platform | Writable fork and feature branch |
| THXH-002 | Implement THOX.ai design tokens and branding overlay | Frontend | `thox-brand.css` |
| THXH-003 | Add DigitalHuman and internal-agent command center | AI + Frontend | `thox-brand.js` |
| THXH-004 | Add adaptive device profiles | Frontend | Nova, Mini, Mini Air, Clip, Key, Watch |
| THXH-005 | Add safe gateway launch-context hydration | AI + Frontend | `thox-launch-context.js` |
| THXH-006 | Add cross-platform local launchers | Platform | Bash and PowerShell launchers |
| THXH-007 | Add Docker extension overlay | Platform | Compose override |
| THXH-008 | Build Vercel device gateway | Frontend + Integration | `thox/vercel` |
| THXH-009 | Document ecosystem and MVP portfolio | Architecture | Required living documents |

## P0 — Merge gate

| ID | Work item | Owner type | Definition of done |
|---|---|---|---|
| THXH-010 | Static extension contract tests | Platform engineer | Manifest, assets, scripts and safe defaults validated in CI |
| THXH-011 | Vercel gateway build validation | Frontend engineer | `npm test` and `npm run build` pass from `thox/vercel` |
| THXH-012 | Browser smoke test | QA agent | Gateway endpoint/device/agent interactions and mobile layout verified |
| THXH-013 | Upstream regression smoke test | QA agent | Existing Hermes test subset passes with extension disabled and enabled |
| THXH-014 | Security review | Security reviewer | CSP, URL validation, storage boundaries, extension authority and launch query handling approved |
| THXH-015 | Draft PR and review packet | Release agent | PR includes architecture, screenshots/checklist, risks and deployment steps |

## P1 — Agent registry vertical slice

| ID | Work item | Layer | Dependency |
|---|---|---|---|
| THXH-101 | Define `thox.agent-package.v1` JSON schema | AI/backend | THXH-014 |
| THXH-102 | Implement signed local agent registry | Backend | THXH-101 |
| THXH-103 | Import Sadie Weaving profile package | AI | THXH-101 |
| THXH-104 | Import internal specialist packages | AI | THXH-101 |
| THXH-105 | Add registry catalog UI | Frontend | THXH-102 |
| THXH-106 | Record agent/model/policy versions in session metadata | Backend | THXH-102 |
| THXH-107 | Add offline cache and rollback | Backend | THXH-102 |

## P1 — Fleet and route status

| ID | Work item | Layer | Dependency |
|---|---|---|---|
| THXH-120 | Define authenticated sidecar contract | Backend/security | THXH-014 |
| THXH-121 | Implement ThoxRoute health adapter | Backend | THXH-120 |
| THXH-122 | Implement MeshStack node discovery adapter | Backend | THXH-120 |
| THXH-123 | Build fleet status panel | Frontend | THXH-121, THXH-122 |
| THXH-124 | Add explicit approvals for mutating actions | Security/frontend | THXH-123 |
| THXH-125 | Add evidence-grounded diagnostic agent | AI | THXH-123 |

## P2 — Distribution

| ID | Work item | Layer | Dependency |
|---|---|---|---|
| THXH-201 | Import `thox/vercel` as a dedicated Vercel project | DevOps | THXH-011 |
| THXH-202 | Configure preview and production environments | DevOps | THXH-201 |
| THXH-203 | Add preview validation and promotion workflow | DevOps/QA | THXH-202 |
| THXH-204 | Package installable THOX extension release | Platform | THXH-013 |
| THXH-205 | Publish PWA icons and platform install metadata | Frontend | Brand asset approval |
| THXH-206 | Create Windows/macOS/Linux installers | Platform | THXH-204 |

## P3 — MeshStack offline synchronization

| ID | Work item | Layer | Dependency |
|---|---|---|---|
| THXH-301 | Define sync object model and conflict policy | Architecture | Agent registry stable |
| THXH-302 | Implement encrypted peer identity | Security/backend | THXH-301 |
| THXH-303 | Synchronize agent packages and public metadata | Backend | THXH-302 |
| THXH-304 | Synchronize approved session metadata | Backend | THXH-302 |
| THXH-305 | Build conflict review experience | Frontend | THXH-304 |
| THXH-306 | Add device revocation and key rotation | Security | THXH-302 |

## Continuous quality gates

- Keep upstream protocol names, routes, storage keys and CSRF behavior unchanged unless an upstream contribution explicitly changes them.
- Require explicit user approval for destructive shell, file, device or mesh actions.
- Reject credentials embedded in endpoint URLs.
- Never route private Hermes message traffic through the public Vercel gateway.
- Test desktop, mobile, touch, keyboard navigation and reduced-motion behavior.
- Update `ecosystem_map.md`, `mvp_catalog.md` and this queue in the same PR as architectural changes.
