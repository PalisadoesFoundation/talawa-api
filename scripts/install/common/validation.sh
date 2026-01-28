#!/usr/bin/env bash
# scripts/install/common/validation.sh

set -euo pipefail

##############################################################################
# Talawa API - Common Validation Functions
##############################################################################

# -----------------------------------------------------------------------------
# Dependency Import
# -----------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/logging.sh" ]; then
  # shellcheck source=scripts/install/common/logging.sh
  source "$SCRIPT_DIR/logging.sh"
else
  # Fallback definitions (Updated to match repo style: Plain text, no ANSI colors)
  echo " WARN: logging.sh not found in $SCRIPT_DIR. Using fallbacks." >&2
  info()    { echo "INFO: $*"; }
  warn()    { echo "WARN: $*" >&2; }
  error()   { echo "✗ $*" >&2; }
  success() { echo "✓ $*"; }
  debug()   { :; }
fi

##############################################################################
# EXISTING SECURITY CHECKS
##############################################################################

validate_version_string() {
    local version="$1"
    local field_name="$2"
    
    if [ -z "$version" ] || [ "$version" = "null" ]; then
        error "Invalid $field_name: version string is empty or null"
        return 1
    fi
    
    if [[ "$version" =~ ^- ]]; then
        error "Invalid $field_name: '$version' (version cannot start with dash)"
        info "Version strings starting with '-' are rejected to prevent option injection"
        return 1
    fi
    
    local pattern='^[a-zA-Z0-9./~^=<>-]+$'
    if [[ ! "$version" =~ $pattern ]]; then
        error "Invalid $field_name: '$version'"
        info "Rejected characters found: $(printf '%s' "$version" | tr -d 'a-zA-Z0-9./~^=<>-')"
        return 1
    fi
    
    if [[ ! "$version" =~ [0-9] ]] && [[ ! "$version" =~ ^(lts|latest|lts/latest|lts/[a-zA-Z]+)$ ]]; then
        error "Invalid $field_name: '$version' doesn't appear to be a valid version"
        return 1
    fi
    
    return 0
}

parse_package_json() {
    local jq_query="$1"
    local default_value="$2"
    local field_name="$3"
    local is_required="${4:-false}"
    
    if ! command -v jq &> /dev/null; then
        error "jq is required but not installed"
        return 1 # Soft fail
    fi
    
    if [ ! -r "package.json" ]; then
        error "Cannot read package.json file"
        return 1 # Soft fail
    fi
    
    local result
    if ! result=$(jq -r "($jq_query) // empty" package.json 2>&1); then
        error "Failed to parse $field_name from package.json"
        info "jq error: $result"
        return 1 # Soft fail
    fi
    
    if [ -z "$result" ]; then
        if [ "$is_required" = "true" ]; then
            error "$field_name not found in package.json (required field)"
            return 1 # Soft fail
        fi
        if [ -n "$default_value" ]; then
            echo "$default_value"
            return 0
        fi
        echo ""
        return 0
    fi
    echo "$result"
}

handle_version_validation_error() {
    local field_name="$1"
    local current_value="$2"
    
    error "Security validation failed for $field_name"
    info "Current value: '$current_value'"
    info "Ensure version follows semver format (e.g., 18.0.0, ^18.0.0)"
    return 1 # Soft fail
}

retry_command() {
    local max_attempts="$1"
    shift
    local attempt=1
    local exit_code=0
    
    while [ "$attempt" -le "$max_attempts" ]; do
        if [ "$attempt" -gt 1 ]; then
            local delay=$((2 ** (attempt - 1)))
            warn "Retry attempt $attempt of $max_attempts... sleeping for ${delay}s"
            sleep "$delay"
        fi
        
        # Wrapped to prevent 'set -e' from exiting script on failure
        if "$@"; then
            return 0
        else 
            exit_code=$?
        fi
        
        attempt=$((attempt + 1))
    done
    
    error "Command failed after $max_attempts attempts: $*"
    return "$exit_code"
}

##############################################################################
# NEW FUNCTIONALITY
##############################################################################

validate_repository_root() {
  debug "Validating repository root..."
  # Check if .git exists (can be file OR dir for worktrees)
  if [ -e ".git" ] && [ -f "package.json" ]; then
    success "Repository root validated"
    return 0
  fi
  error "Not at repository root (.git and package.json required)"
  return 1
}

validate_disk_space() {
  local min_mb="${1:-2000}"
  debug "Checking for at least ${min_mb}MB free space..."
  
  local avail_kb
  local avail_mb

  if ! avail_kb=$(df -Pk . | awk 'NR==2 {print $4}'); then
    error "Unable to determine available disk space"
    return 1
  fi

  avail_mb=$((avail_kb / 1024))

  if [ "$avail_mb" -ge "$min_mb" ]; then
    success "Disk space OK: ${avail_mb}MB available (Required: ${min_mb}MB)"
    return 0
  else
    error "Insufficient disk space: ${avail_mb}MB available. Minimum required is ${min_mb}MB"
    return 1
  fi
}

validate_internet_connectivity() {
  debug "Checking internet connectivity..."
  local hosts=("github.com" "registry.npmjs.org")
  local all_connected=1

  for host in "${hosts[@]}"; do
    local host_ok=0
    if command -v curl >/dev/null 2>&1; then
      if curl -sSf --max-time 5 "https://$host" >/dev/null 2>&1; then host_ok=1; fi
    elif command -v ping >/dev/null 2>&1; then
      # CodeRabbit Note: some linux distros don't support -W, but we keep it for now
      if ping -c 1 -W 3 "$host" >/dev/null 2>&1; then host_ok=1; fi
    fi

    if [ "$host_ok" -eq 1 ]; then
      success "Connection to $host verified"
    else
      warn "Could not reach $host"
      all_connected=0
    fi
  done

  if [ "$all_connected" -eq 1 ]; then
    return 0
  else
    error "Internet connectivity check failed."
    return 1
  fi
}

validate_prerequisites() {
  info "Running system pre-flight checks..."
  local rc=0

  validate_repository_root || rc=1
  validate_disk_space 2000 || rc=1
  validate_internet_connectivity || rc=1

  if [ "$rc" -eq 0 ]; then
    success "All prerequisites met."
  else
    error "Prerequisites check failed."
  fi
  return "$rc"
}