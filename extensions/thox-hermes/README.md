# THOX Hermes Command Fabric Extension

This first-party extension applies the THOX.ai design system to Hermes WebUI and adds an operational command fabric for:

- THOX DigitalHumans, including Sadie Weaving.
- THOX Hermes internal agent teams.
- ThoxRoute, THOXCore, MeshStack, local-model, and fallback route visibility.
- Device fleet views for ThoxNova, ThoxMini, ThoxMini Air, ThoxClip, ThoxKey, ThoxWatch, and ThoxVault.
- Responsive device modes that preserve the same agent identity and controls across web, desktop, mobile, and embedded THOX surfaces.

The extension is deliberately isolated from upstream Hermes core. This keeps the fork updateable while still making THOX the default branded experience when launched with the provided THOX scripts.

## Start locally

Linux, macOS, or WSL:

```bash
bash ./thox-start.sh
```

Windows PowerShell:

```powershell
./thox-start.ps1
```

The launchers start the local status sidecar and then run the existing Hermes bootstrap with this extension enabled.

## Safe-command posture

The sidecar is read-mostly and binds only to `127.0.0.1`. Device mutations are disabled by default. To enable the safe, bounded command set (`diagnostics`, `refresh`, and `sync`) through the Hermes sidecar proxy:

```bash
export THOX_HERMES_ALLOW_COMMANDS=1
```

The sidecar supports Hermes `token-v1` proxy authentication through `X-Hermes-Sidecar-Token`. Arbitrary shell commands, secrets, and provider credentials are never exposed by this extension.
