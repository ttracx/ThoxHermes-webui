# THOX Hermes Development Queue

## P0 — integration and validation

1. Connect the sidecar to the canonical MeshStack device registry.
2. Connect route records to ThoxRoute health and policy endpoints.
3. Map THOX DigitalHuman profiles to Hermes profile/session APIs rather than prompt prefill only.
4. Add browser tests for command-fabric injection, keyboard access, mobile layout, and offline sidecar behavior.
5. Add signed device identity and enrollment before enabling any state-changing device operations.

## P1 — end-to-end device operations

1. Implement device enrollment, attestation, and owner approval.
2. Add package/model/agent synchronization status from `thox.package.json` manifests.
3. Add firmware and configuration update plans with rollback checkpoints.
4. Add ThoxNova touch navigation and persistent local notifications.
5. Add ThoxMini, Air, Clip, and Key companion actions through narrow, device-specific adapters.

## P2 — production hardening

1. Add WebAuthn/passkey gates for privileged device operations.
2. Add append-only audit records for agent and device commands.
3. Add structured OpenTelemetry-compatible local logs without conversation content.
4. Add signed release artifacts and SBOM generation.
5. Add Vercel preview checks for the static control-plane surface only.
