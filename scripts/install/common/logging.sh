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
error()   { _log_write "[x] ERROR: $*" "stderr"; }
success() { _log_write "[OK] $*"; }
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

# Timing tracking (compatible with bash 3.2+)
__TIMING_LABELS=()
__TIMING_VALUES=()
__TIMING_STATUS=()

# with_timer: Execute a command and record its execution time
# Usage: with_timer "label" command [args...]
with_timer() {
  local label="$1"
  shift
  local t0 t1 elapsed exit_code errexit
  
  t0=$(date +%s)
  
  # Temporarily disable errexit to capture exit code
  errexit=$-
  set +e
  "$@"
  exit_code=$?
  [[ $errexit == *e* ]] && set -e
  
  t1=$(date +%s)
  elapsed=$((t1 - t0))
  
  # Store timing data
  __TIMING_LABELS+=("$label")
  __TIMING_VALUES+=("$elapsed")
  
  if [ $exit_code -eq 0 ]; then
    __TIMING_STATUS+=("OK")
    success "$label completed in ${elapsed}s"
  else
    __TIMING_STATUS+=("FAIL")
    error "$label failed after ${elapsed}s"
  fi
  
  return $exit_code
}

# with_spinner: Execute a command with a visual spinner
# Usage: with_spinner "message" command [args...]
with_spinner() {
  local msg="$1"
  shift
  
  # Run command in background
  ( "$@" ) &
  local pid=$!
  local spin='|/-\'
  local i=0
  
  # Show spinner while process is running
  while kill -0 "$pid" 2>/dev/null; do
    printf "\r[INFO] %s %c" "$msg" "${spin:i++%4:1}"
    sleep 0.2
  done
  
  # Clear spinner line
  printf "\r"
  
  # Wait for process and capture exit code
  local exit_code errexit
  errexit=$-
  set +e
  wait "$pid"
  exit_code=$?
  [[ $errexit == *e* ]] && set -e
  
  if [ $exit_code -eq 0 ]; then
    success "$msg"
  else
    error "$msg failed"
  fi
  
  return $exit_code
}

# print_timing_summary: Display timing information for all tracked operations
print_timing_summary() {
  printf "\n"
  printf "%s\n" "========================================"
  printf "%s\n" "Timing Summary"
  printf "%s\n" "========================================"
  
  if [ ${#__TIMING_LABELS[@]} -eq 0 ]; then
    printf "%s\n" "No timing data recorded."
  else
    local total=0
    local i
    for i in "${!__TIMING_LABELS[@]}"; do
      local status="${__TIMING_STATUS[$i]:-OK}"
      printf "[%s] %s: %ss\n" "$status" "${__TIMING_LABELS[$i]}" "${__TIMING_VALUES[$i]}"
      total=$((total + ${__TIMING_VALUES[$i]}))
    done
    printf "%s\n" "----------------------------------------"
    printf "Total time: %ss\n" "$total"
  fi
  
  printf "%s\n" "========================================"
  printf "\n"
}

# print_installation_summary: Display final installation summary
# Usage: print_installation_summary [exit_code]
print_installation_summary() {
  local exit_code="${1:-0}"
  printf "\n"
  printf "%s\n" "========================================"
  printf "%s\n" "Installation Summary"
  printf "%s\n" "========================================"
  
  if [ "$exit_code" -eq 0 ]; then
    printf "%s\n" "[OK] Core dependencies verified"
    printf "%s\n" "[OK] Installation completed successfully"
  else
    printf "%s\n" "[x] Installation failed (exit code: $exit_code)"
  fi
  
  printf "See log: %s\n" "${LOG_FILE}"
  printf "%s\n" "========================================"
  printf "\n"
}

export LOG_FILE

export -f \
  info warn error success debug \
  print_banner print_step print_section print_log_location \
  with_timer with_spinner print_timing_summary print_installation_summary
