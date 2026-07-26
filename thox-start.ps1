$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:HERMES_WEBUI_EXTENSION_DIR = Join-Path $RootDir "extensions"
$env:HERMES_WEBUI_EXTENSION_MANIFEST = "thox-hermes/manifest.json"
if (-not $env:THOX_HERMES_SIDECAR_PORT) { $env:THOX_HERMES_SIDECAR_PORT = "17789" }

$sidecar = Start-Process -FilePath "python" -ArgumentList @(
  (Join-Path $RootDir "extensions/thox-hermes/sidecar/server.py"),
  "--port",
  $env:THOX_HERMES_SIDECAR_PORT
) -PassThru -WindowStyle Hidden

try {
  $deadline = (Get-Date).AddSeconds(5)
  do {
    try {
      Invoke-RestMethod -Uri "http://127.0.0.1:$($env:THOX_HERMES_SIDECAR_PORT)/health" -TimeoutSec 1 | Out-Null
      break
    } catch {
      Start-Sleep -Milliseconds 150
    }
  } while ((Get-Date) -lt $deadline)

  & python (Join-Path $RootDir "bootstrap.py") @args
  exit $LASTEXITCODE
} finally {
  if ($sidecar -and -not $sidecar.HasExited) {
    Stop-Process -Id $sidecar.Id -Force -ErrorAction SilentlyContinue
  }
}
