#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SIDECAR_PID=""

cleanup() {
  if [[ -n "${SIDECAR_PID}" ]] && kill -0 "${SIDECAR_PID}" 2>/dev/null; then
    kill "${SIDECAR_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

export HERMES_WEBUI_EXTENSION_DIR="${ROOT_DIR}/extensions"
export HERMES_WEBUI_EXTENSION_MANIFEST="thox-hermes/manifest.json"
export THOX_HERMES_SIDECAR_PORT="${THOX_HERMES_SIDECAR_PORT:-17789}"

python3 "${ROOT_DIR}/extensions/thox-hermes/sidecar/server.py" --port "${THOX_HERMES_SIDECAR_PORT}" &
SIDECAR_PID=$!

for _ in {1..30}; do
  if python3 - <<PY >/dev/null 2>&1
import urllib.request
urllib.request.urlopen("http://127.0.0.1:${THOX_HERMES_SIDECAR_PORT}/health", timeout=0.3).read()
PY
  then
    break
  fi
  sleep 0.1
done

exec python3 "${ROOT_DIR}/bootstrap.py" "$@"
