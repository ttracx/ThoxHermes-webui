# THOX Hermes Ecosystem Map

```mermaid
flowchart LR
  User[Owner / Operator] --> WebUI[THOX Hermes WebUI]
  WebUI --> DigitalHumans[THOX DigitalHumans / HumanFabric]
  WebUI --> InternalAgents[Hermes Internal Agent Teams]
  WebUI --> Sidecar[THOX Local Sidecar]
  WebUI --> Sessions[Hermes Sessions / Memory / Workspaces]
  DigitalHumans --> ThoxRoute[ThoxRoute]
  InternalAgents --> ThoxRoute
  ThoxRoute --> LocalModels[THOXCore / llama.cpp / Ollama / LiteRT]
  ThoxRoute --> ApprovedFallback[Approved Cloud Fallback]
  Sidecar --> MeshStack[MeshStack Device Registry]
  MeshStack --> Nova[ThoxNova]
  MeshStack --> Mini[ThoxMini]
  MeshStack --> Air[ThoxMini Air]
  MeshStack --> Clip[ThoxClip]
  MeshStack --> Key[ThoxKey]
  MeshStack --> Watch[ThoxWatch]
  MeshStack --> Vault[ThoxVault]
  Vercel[Vercel Static Control Plane] -. public docs only .-> User
```

## Architectural rule

Private sessions, memory, tools, credentials, local models, and device telemetry stay on owner-controlled infrastructure. Cloud surfaces are optional, explicit, and policy-governed.
