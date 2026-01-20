#!/usr/bin/env bash
# Centralized logging helpers for Talawa install scripts.
# Plain-text only (no colors). Dual output: console + log file.
# Debug logging enabled via DEBUG=1.

set -euo pipefail

: "${LOG_FILE:=/tmp/talawa-install-$$.log}"
: "${DEBUG:=0}"

mkdir -p "$(dirname "$LOG_FILE")"
[ -e "$LOG_FILE" ] || : > "$LOG_FILE"

# Internal writer: appends to log file and prints to console.
_log_write() {
  local msg="$1"
  local stream="${2:-stdout}"
  local ts
  ts="$(date '+%Y-%m-%d %H:%M:%S')"

  printf "[%s] %s\n" "$ts" "$msg" >> "$LOG_FILE"

  if [ "$stream" = "stderr" ]; then
    printf "%s\n" "$msg" >&2
  else
    printf "%s\n" "$msg"
  fi
}

info()    { _log_write "[INFO] $*"; }
warn()    { _log_write "WARNING: $*" "stderr"; }
error()   { _log_write "✗ ERROR: $*" "stderr"; }
success() { _log_write "✓ $*"; }
debug()   { [ "$DEBUG" = "1" ] && _log_write "[DEBUG] $*"; }

print_banner() {
  _log_write ""
  _log_write "========================================"
  _log_write "  $1"
  _log_write "========================================"
  _log_write ""
}

print_step() {
  _log_write ""
  _log_write "Step $1/$2: $3"
  _log_write "----------------------------------------"
}

print_section() {
  _log_write ""
  _log_write "========================================"
  _log_write "$1"
  _log_write "========================================"
  _log_write ""
}

print_log_location() {
  info "Installation log saved to: ${LOG_FILE}"
}

export -f \
  info warn error success debug \
  print_banner print_step print_section print_log_location
