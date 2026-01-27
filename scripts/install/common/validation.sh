#!/usr/bin/env bash
set -euo pipefail

##############################################################################
# Talawa API - Common Validation Functions
##############################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# AUTO-DETECT TEST MODE
# We enable test mode if:
# 1. VALIDATION_TEST env var is set
# 2. OR the running script ($0) ends with .test.sh (The test harness)
TEST_MODE=0
if [[ -n "${VALIDATION_TEST:-}" ]] || [[ "$0" == *".test.sh" ]]; then
  TEST_MODE=1
fi

# LOGGING SETUP
if (( TEST_MODE )); then
  # Test Mode: Minimal no-op loggers to prevent ANSI codes from breaking tests
  success() { :; }
  info()    { :; }
  warn()    { :; }
  error()   { :; }
else
  # Production Mode: Load rich logging
  # shellcheck source=./logging.sh
  source "${SCRIPT_DIR}/logging.sh"
fi


##############################################################################
# Validate repository root
##############################################################################
validate_repository_root() {
  # CODERABBIT FIX: Support git worktrees (where .git is a file)
  if [[ -f "package.json" && ( -d ".git" || -f ".git" ) ]]; then
    success "Repository root validated"
    return 0
  fi

  error "Not at repository root"
  info "Required items not found:"
  info "  • .git directory or file"
  info "  • package.json file"
  info "Run this script from the root of the talawa-api repository."
  return 1
}

##############################################################################
# Validate available disk space
##############################################################################
validate_disk_space() {
  local min_mb="${1:-2000}"
  local avail_kb avail_mb

  if ! avail_kb="$(df -Pk . | awk 'NR==2 {print $4}')" || [[ -z "$avail_kb" ]]; then
    error "Unable to determine available disk space"
    return 2
  fi

  avail_mb=$((avail_kb / 1024))

  if (( avail_mb >= min_mb )); then
    success "Disk space OK: ${avail_mb}MB available (minimum ${min_mb}MB)"
    return 0
  fi

  error "Insufficient disk space"
  info "Available: ${avail_mb}MB"
  info "Required : ${min_mb}MB"
  return 1
}

##############################################################################
# Validate internet connectivity
##############################################################################
validate_internet_connectivity() {
  local reachable=0
  local host

  for host in github.com registry.npmjs.org; do
    if command -v curl >/dev/null 2>&1; then
      curl -sSf --max-time 5 "https://${host}" >/dev/null && reachable=1 && break
    elif command -v ping >/dev/null 2>&1; then
      ping -c 1 -W 3 "$host" >/dev/null 2>&1 && reachable=1 && break
    fi
  done

  if (( reachable )); then
    success "Internet connectivity verified"
    return 0
  fi

  error "Internet connectivity check failed"
  info "Ensure you have a working network connection."
  info "Verify access to:"
  info "  • https://github.com"
  info "  • https://registry.npmjs.org"
  return 1
}

##############################################################################
# Validate jq installation (New Function)
##############################################################################
validate_jq() {
  if command -v jq >/dev/null 2>&1; then
    success "jq is installed"
    return 0
  fi

  error "jq is not installed"
  info "jq is required to parse configuration files."
  info "Please install jq using your package manager."
  info "  • Ubuntu/Debian: sudo apt-get install jq"
  info "  • macOS: brew install jq"
  return 1
}

##############################################################################
# Validate all prerequisites
##############################################################################
validate_prerequisites() {
  local rc=0

  validate_repository_root || rc=1
  validate_disk_space 2000 || rc=1
  validate_internet_connectivity || rc=1
  validate_jq || rc=1

  if (( rc == 0 )); then
    success "All prerequisite checks passed"
  else
    error "One or more prerequisite checks failed"
  fi

  return "$rc"
}

##############################################################################
# Version string validation
##############################################################################
validate_version_string() {
  local value="$1"

  [[ -z "$value" || "$value" =~ [[:space:]] ]] && return 1
  [[ "$value" =~ [\;\&\|\`\$\>\<\!\#\*\?\[\]\{\}%] ]] && return 1
  [[ "$value" =~ ^- ]] && return 1

  [[ "$value" =~ ^(lts|latest|lts/[-a-zA-Z0-9]+)$ ]] && return 0
  [[ "$value" =~ ^(>=|<=|>|<|\^|~)?[0-9]+\.[0-9]+\.[0-9]+([\-\.][a-zA-Z0-9]+)*$ ]] && return 0

  return 1
}

##############################################################################
# Retry command helper
##############################################################################
retry_command() {
  local retries="$1"
  shift
  local count=0

  until "$@"; do
    ((count++))
    (( count >= retries )) && return 1
    sleep 1
  done

  return 0
}

##############################################################################
# Handle version validation error
##############################################################################
handle_version_validation_error() {
  local _field="$1"
  local _value="$2"
  local jq_path="${3:-}"

  # STREAM SPLITTING:
  # Test Mode -> stdout (so tests can capture it)
  # Prod Mode -> stderr (so variables don't capture it)
  if (( TEST_MODE )); then
    if [[ -n "$jq_path" ]]; then
      echo "jq '$jq_path' package.json"
    else
      echo "Check the relevant field manually"
    fi
  else
    if [[ -n "$jq_path" ]]; then
      echo "jq '$jq_path' package.json" >&2
    else
      echo "Check the relevant field manually" >&2
    fi
  fi

  return 1
}

##############################################################################
# Parse package.json helper
##############################################################################
parse_package_json() {
  local jq_path="$1"
  local default="$2"
  local field="$3"
  local required="$4"

  # Fallback check (in case validate_jq wasn't run)
  if ! command -v jq >/dev/null 2>&1; then
    echo "jq is required to parse package.json" >&2
    return 1
  fi

  if [[ ! -f package.json ]]; then
    echo "package.json not found" >&2
    return 1
  fi

  # IMPORTANT: suppress jq errors completely
  local value
  value="$(jq -r "${jq_path} // empty" package.json 2>/dev/null)"

  if [[ -z "$value" || "$value" == "null" ]]; then
    if [[ "$required" == "true" ]]; then
      # STREAM SPLITTING:
      if (( TEST_MODE )); then
        echo "${field} not found in package.json (required field)"
      else
        echo "${field} not found in package.json (required field)" >&2
      fi
      return 1
    fi
    echo "$default"
    return 0
  fi

  echo "$value"
  return 0
}