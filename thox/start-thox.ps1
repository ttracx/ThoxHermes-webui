[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]] $BootstrapArguments
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

try {
    $RootDirectory = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
    $ExtensionDirectory = Join-Path $RootDirectory 'thox\extensions'
    $ManifestPath = 'thox-hermes/manifest.json'
    $BootstrapPath = Join-Path $RootDirectory 'bootstrap.py'
    $ManifestFile = Join-Path $ExtensionDirectory 'thox-hermes\manifest.json'

    if (-not (Test-Path -LiteralPath $BootstrapPath -PathType Leaf)) {
        throw "bootstrap.py was not found at $BootstrapPath"
    }
    if (-not (Test-Path -LiteralPath $ManifestFile -PathType Leaf)) {
        throw "THOX extension manifest was not found at $ManifestFile"
    }

    $PythonCommand = if (Get-Command python -ErrorAction SilentlyContinue) {
        'python'
    } elseif (Get-Command py -ErrorAction SilentlyContinue) {
        'py'
    } else {
        throw 'Python 3 was not found. Install Python 3.11 or newer and retry.'
    }

    if (-not $env:HERMES_WEBUI_EXTENSION_DIR) {
        $env:HERMES_WEBUI_EXTENSION_DIR = $ExtensionDirectory
    }
    if (-not $env:HERMES_WEBUI_EXTENSION_MANIFEST) {
        $env:HERMES_WEBUI_EXTENSION_MANIFEST = $ManifestPath
    }
    if (-not $env:HERMES_WEBUI_HOST) {
        $env:HERMES_WEBUI_HOST = '127.0.0.1'
    }
    if (-not $env:HERMES_WEBUI_PORT) {
        $env:HERMES_WEBUI_PORT = '8787'
    }

    Write-Host "Starting THOX Hermes on http://$($env:HERMES_WEBUI_HOST):$($env:HERMES_WEBUI_PORT)" -ForegroundColor Green
    Write-Host "Extension directory: $($env:HERMES_WEBUI_EXTENSION_DIR)" -ForegroundColor DarkGray

    & $PythonCommand $BootstrapPath @BootstrapArguments
    if ($LASTEXITCODE -ne 0) {
        throw "THOX Hermes exited with code $LASTEXITCODE"
    }
} catch {
    Write-Error "THOX Hermes startup failed: $($_.Exception.Message)"
    exit 1
}
