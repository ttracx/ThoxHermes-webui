#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
EXTENSION_DIR="${ROOT_DIR}/thox/extensions"
MANIFEST_PATH="thox-hermes/manifest.json"
PYTHON_BIN="${PYTHON_BIN:-python3}"

fail() {
  printf 'THOX Hermes startup error: %s\n' "$1" >&2
  exit 1
}

command -v "${PYTHON_BIN}" >/dev/null 2>&1 || fail "${PYTHON_BIN} was not found in PATH."
[[ -f "${ROOT_DIR}/bootstrap.py" ]] || fail "bootstrap.py was not found at ${ROOT_DIR}."
[[ -f "${EXTENSION_DIR}/${MANIFEST_PATH}" ]] || fail "THOX extension manifest is missing."

export HERMES_WEBUI_EXTENSION_DIR="${HERMES_WEBUI_EXTENSION_DIR:-${EXTENSION_DIR}}"
export HERMES_WEBUI_EXTENSION_MANIFEST="${HERMES_WEBUI_EXTENSION_MANIFEST:-${MANIFEST_PATH}}"
export HERMES_WEBUI_HOST="${HERMES_WEBUI_HOST:-127.0.0.1}"
export HERMES_WEBUI_PORT="${HERMES_WEBUI_PORT:-8787}"

printf 'Starting THOX Hermes on http://%s:%s\n' "${HERMES_WEBUI_HOST}" "${HERMES_WEBUI_PORT}"
printf 'Extension directory: %s\n' "${HERMES_WEBUI_EXTENSION_DIR}"

exec "${PYTHON_BIN}" "${ROOT_DIR}/bootstrap.py" "$@"
