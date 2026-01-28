#!/usr/bin/env bash
# scripts/install/common/validation.sh

set -euo pipefail

##############################################################################
# Talawa API - Common Validation Functions
# 
# This file contains shared validation functions used by installation scripts
# across different platforms (Linux, macOS, etc.)
##############################################################################

# -----------------------------------------------------------------------------
# Dependency Import (Updated for Install2Fix)
# -----------------------------------------------------------------------------
# Source the centralized logging library if available.
# We expect logging.sh to be in the same directory as this script.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/logging.sh" ]; then
  # shellcheck source=scripts/install/common/logging.sh
  source "$SCRIPT_DIR/logging.sh"
else
  # Fallback definitions if logging.sh is missing (safe default)
  echo "⚠️  WARNING: logging.sh not found in $SCRIPT_DIR. Using fallbacks." >&2
  info()    { echo "[INFO] $*"; }
  warn()    { echo "[WARN] $*" >&2; }
  error()   { echo "[ERROR] $*" >&2; }
  success() { echo "[OK] $*"; }
  debug()   { :; }
fi

##############################################################################
# EXISTING SECURITY CHECKS (Preserved)
##############################################################################

##############################################################################
# Validate version strings to prevent command injection
# Usage: validate_version_string "version" "field_name"
##############################################################################
validate_version_string() {
    local version="$1"
    local field_name="$2"
    
    # Check if version is empty or null
    if [ -z "$version" ] || [ "$version" = "null" ]; then
        error "Invalid $field_name: version string is empty or null"
        return 1
    fi
    
    # Reject versions starting with dash to prevent option injection
    if [[ "$version" =~ ^- ]]; then
        error "Invalid $field_name: '$version' (version cannot start with dash)"
        echo ""
        info "Version strings starting with '-' are rejected to prevent option injection"
        info "into package managers (fnm, npm, etc.)"
        return 1
    fi
    
    # Allow only safe characters
    local pattern='^[a-zA-Z0-9./~^=<>-]+$'
    if [[ ! "$version" =~ $pattern ]]; then
        error "Invalid $field_name: '$version'"
        echo ""
        info "Version strings must contain only alphanumeric and ./~^=<>- characters."
        info "Rejected characters found: $(printf '%s' "$version" | tr -d 'a-zA-Z0-9./~^=<>-')"
        return 1
    fi
    
    # Additional check: ensure it looks like a version
    if [[ ! "$version" =~ [0-9] ]] && [[ ! "$version" =~ ^(lts|latest|lts/latest|lts/[a-zA-Z]+)$ ]]; then
        error "Invalid $field_name: '$version' doesn't appear to be a valid version"
        return 1
    fi
    
    return 0
}

##############################################################################
# Safe jq parsing helper function
##############################################################################
parse_package_json() {
    local jq_query="$1"
    local default_value="$2"
    local field_name="$3"
    local is_required="${4:-false}"
    
    # Verify jq is available
    if ! command -v jq &> /dev/null; then
        error "jq is required but not installed"
        info "Install jq using your package manager (apt, dnf, brew, etc)."
        exit 1
    fi
    
    # Verify package.json exists
    if [ ! -r "package.json" ]; then
        error "Cannot read package.json file"
        exit 1
    fi
    
    local result
    
    if ! result=$(jq -r "($jq_query) // empty" package.json 2>&1); then
        error "Failed to parse $field_name from package.json"
        info "jq error: $result"
        exit 1
    fi
    
    # Check for empty results
    if [ -z "$result" ]; then
        if [ "$is_required" = "true" ]; then
            error "$field_name not found in package.json (required field)"
            exit 1
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

##############################################################################
# Validation error handler for version strings
##############################################################################
handle_version_validation_error() {
    local field_name="$1"
    local current_value="$2"
    local jq_path="${3:-}"
    
    error "Security validation failed for $field_name"
    info "Current value: '$current_value'"
    info "Ensure version follows semver format (e.g., 18.0.0, ^18.0.0)"
    exit 1
}

##############################################################################
# Retry command with exponential backoff
##############################################################################
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
        
        "$@"
        exit_code=$?
        
        if [ "$exit_code" -eq 0 ]; then
            return 0
        fi
        
        attempt=$((attempt + 1))
    done
    
    error "Command failed after $max_attempts attempts: $*"
    return "$exit_code"
}

##############################################################################
# NEW FUNCTIONALITY (Install2Fix Checks)
##############################################################################

validate_repository_root() {
  debug "Validating repository root..."
  # Check for .git directory and package.json
  if [ -d ".git" ] && [ -f "package.json" ]; then
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

  # 'df -Pk .' ensures POSIX compliance (1024-byte blocks)
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
    # Try curl first (preferred), fall back to ping
    if command -v curl >/dev/null 2>&1; then
      if curl -sSf --max-time 5 "https://$host" >/dev/null 2>&1; then host_ok=1; fi
    elif command -v ping >/dev/null 2>&1; then
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
    error "Internet connectivity check failed. Ensure GitHub and NPM are reachable."
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