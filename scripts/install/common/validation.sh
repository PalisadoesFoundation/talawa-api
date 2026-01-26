#!/usr/bin/env bash
set -euo pipefail

##############################################################################
# Talawa API - Common Validation Functions
#
# Shared prerequisite validation helpers for installation scripts.
# Uses the centralized logging library for consistent output and logging.
#
# Usage:
#   source scripts/install/common/validation.sh
##############################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./logging.sh
source "${SCRIPT_DIR}/logging.sh"

##############################################################################
# Validate repository root
#
# Ensures the script is executed from the repository root by checking for
# required files and directories.
#
# Returns:
#   0 on success
#   1 on failure
##############################################################################
validate_repository_root() {
  if [[ -d ".git" && -f "package.json" ]]; then
    success "Repository root validated"
    return 0
  fi

  error "Not at repository root"
  info "Required items not found:"
  info "  • .git directory"
  info "  • package.json file"
  info "Run this script from the root of the talawa-api repository."
  return 1
}

##############################################################################
# Validate available disk space
#
# Arguments:
#   $1 - Minimum required disk space in MB (default: 2000)
#
# Returns:
#   0 on success
#   1 if insufficient space
#   2 if disk usage cannot be determined
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
#
# Checks connectivity using curl or ping against reliable hosts.
#
# Returns:
#   0 on success
#   1 on failure
##############################################################################
validate_internet_connectivity() {
  local host
  local reachable=0

  for host in github.com registry.npmjs.org; do
    if command -v curl >/dev/null 2>&1; then
      if curl -sSf --max-time 5 "https://${host}" >/dev/null; then
        reachable=1
        break
      fi
    elif command -v ping >/dev/null 2>&1; then
      if ping -c 1 -W 3 "$host" >/dev/null 2>&1; then
        reachable=1
        break
      fi
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
# Validate all prerequisites
#
# Runs all prerequisite checks and reports consolidated status.
#
# Returns:
#   0 if all checks pass
#   1 if any check fails
##############################################################################
validate_prerequisites() {
  local rc=0

  validate_repository_root || rc=1
  validate_disk_space 2000 || rc=1
  validate_internet_connectivity || rc=1

  if (( rc == 0 )); then
    success "All prerequisite checks passed"
  else
    error "One or more prerequisite checks failed"
  fi

  return "$rc"
}
