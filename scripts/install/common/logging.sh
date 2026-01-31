#!/usr/bin/env bash
# Centralized logging helpers for Talawa install scripts.
# Plain-text only (no colors). Dual output: console + log file.
# Debug logging enabled via DEBUG=1.

set -euo pipefail

: "${LOG_FILE:=/tmp/talawa-install-$$.log}"
: "${DEBUG:=0}"

mkdir -p "$(dirname "$LOG_FILE")"
[ -e "$LOG_FILE" ] || : > "$LOG_FILE"

# Timing storage: indexed array of "label:seconds" (Bash 3.2+ compatible).
__TIMINGS=()

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
debug()   { [ "$DEBUG" = "1" ] && _log_write "[DEBUG] $*" || true; }

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

# Run command and record elapsed time. Label is first arg; rest is the command.
# Writes to console and log via success(). Returns the exit code of the command.
with_timer() {
  local label="$1"
  shift
  if [ $# -eq 0 ]; then
    error "with_timer: no command given (usage: with_timer <label> <cmd...>)"
    return 1
  fi
  local t0 t1 elapsed ret
  t0=$(date +%s)
  "$@" || ret=$?
  t1=$(date +%s)
  elapsed=$((t1 - t0))
  __TIMINGS+=("$label:$elapsed")
  success "$label completed in ${elapsed}s"
  if [ -n "${ret:-}" ]; then
    return "$ret"
  fi
  return 0
}

# Run command with ASCII spinner. Message is first arg; rest is the command.
# Spinner is console-only; command stdout/stderr captured to temp file and printed after.
# Exit code is that of the command.
with_spinner() {
  local msg="$1"
  shift
  if [ $# -eq 0 ]; then
    error "with_spinner: no command given (usage: with_spinner <msg> <cmd...>)"
    return 1
  fi
  local tmpfile
  tmpfile="${TMPDIR:-/tmp}/talawa-spinner-$$-${RANDOM:-0}.out"
  ( "$@" ) > "$tmpfile" 2>&1 &
  local pid=$!
  local spin='|/-\'
  local i=0
  while kill -0 "$pid" 2>/dev/null; do
    printf "\033[2K\r[INFO] %s %c" "$msg" "${spin:i++%4:1}"
    sleep 0.2
  done
  printf "\033[2K\r"
  wait "$pid"
  local ret=$?
  [ -f "$tmpfile" ] && cat "$tmpfile"
  rm -f "$tmpfile"
  return $ret
}

# Print timing summary to console and log (dual output).
print_timing_summary() {
  _log_write "========================================"
  _log_write "Timing Summary"
  _log_write "========================================"
  local entry label sec
  for entry in "${__TIMINGS[@]}"; do
    # Last colon separates label from seconds (allows labels containing ':')
    sec="${entry##*:}"
    label="${entry%:*}"
    _log_write "✓ $label: ${sec}s"
  done
}

# Print installation summary to console and log (dual output).
# TODO: Replace placeholder "Core dependencies verified" with real installation state.
# Follow-up: either pass status lines as arguments (e.g. print_installation_summary "✓ Step A" "✓ Step B")
# and write them via _log_write, or build a summary array from actual install results and iterate.
print_installation_summary() {
  _log_write "========================================"
  _log_write "Installation Summary"
  _log_write "========================================"
  _log_write "✓ Core dependencies verified"
  _log_write "See log: ${LOG_FILE}"
}

export LOG_FILE

export -f _log_write \
  info warn error success debug \
  print_banner print_step print_section print_log_location \
  with_timer with_spinner print_timing_summary print_installation_summary
