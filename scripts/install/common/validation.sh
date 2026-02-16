#!/usr/bin/env bash

##############################################################################
# Talawa API - Common Validation Functions
#
# This file contains shared validation functions used by installation scripts
# across different platforms (Linux, macOS, etc.)
#
# Usage: Source this file at the beginning of installation scripts:
#        source "$(dirname "$0")/../common/validation.sh"
#
# REQUIREMENTS:
#   The sourcing script MUST define these functions before sourcing this file:
#   - info()    : For informational messages (blue output)
#   - warn()    : For warning messages (yellow output)
#   - error()   : For error messages (red output)
#   - success() : For success messages (green output)
##############################################################################

##############################################################################
# Guard: Verify required functions are defined
##############################################################################
if ! declare -F info >/dev/null 2>&1 || ! declare -F error >/dev/null 2>&1 || ! declare -F warn >/dev/null 2>&1 || ! declare -F success >/dev/null 2>&1; then
    echo "ERROR: validation.sh requires info(), warn(), error(), and success() functions to be defined." >&2
    echo "" >&2
    echo "Please ensure your script defines these functions before sourcing validation.sh:" >&2
    echo "  info() { echo -e \"\${BLUE}ℹ\${NC} \$1\"; }" >&2
    echo "  warn() { echo -e \"\${YELLOW}⚠\${NC} \$1\"; }" >&2
    echo "  error() { echo -e \"\${RED}✗\${NC} \$1\"; }" >&2
    echo "  success() { echo -e \"\${GREEN}✓\${NC} \$1\"; }" >&2
    echo "" >&2
    exit 1
fi

##############################################################################
# validate_version_string - Validate version strings to prevent command injection
#
# Allowed characters: alphanumeric, dots, hyphens, carets, tildes, equals,
#                     greater than, less than, forward slash (covers semver patterns)
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
    
    # Allow only: alphanumeric, dots, hyphens, carets, tildes, equals, greater/less than, forward slash
    local pattern='^[a-zA-Z0-9./~^=<>-]+$'
    if [[ ! "$version" =~ $pattern ]]; then
        error "Invalid $field_name: '$version'"
        echo ""
        info "Version strings must contain only:"
        echo "  • Letters (a-z, A-Z)"
        echo "  • Numbers (0-9)"
        echo "  • Dots (.)"
        echo "  • Hyphens (-)"
        echo "  • Version operators (^, ~, =, >, <)"
        echo "  • Forward slash (/) for lts/latest patterns"
        echo ""
        info "Rejected characters found: $(printf '%s' "$version" | tr -d 'a-zA-Z0-9./~^=<>-')"
        echo ""
        info "Security note: Special characters, spaces, semicolons, and shell"
        info "metacharacters are not allowed to prevent command injection."
        return 1
    fi
    
    # Additional check: ensure it looks like a version (has at least one number)
    # Exception: allow 'lts' or 'latest' as valid version identifiers
    if [[ ! "$version" =~ [0-9] ]] && [[ ! "$version" =~ ^(lts|latest|lts/latest|lts/[a-zA-Z]+)$ ]]; then
        error "Invalid $field_name: '$version' doesn't appear to be a valid version"
        echo ""
        info "Expected formats:"
        echo "  • Exact version:  \"18.0.0\" or \"23.7.0\""
        echo "  • Range:          \">=18.0.0\""
        echo "  • Caret:          \"^18.0.0\""
        echo "  • Tilde:          \"~18.0.0\""
        echo "  • LTS:            \"lts\" or \"lts/latest\""
        return 1
    fi
    
    return 0
}

##############################################################################
# parse_package_json - Safe jq parsing helper
#
# Provides robust jq parsing with verification that jq is installed.
# Usage: parse_package_json "jq_query" "default_value" "field_name" [is_required]
##############################################################################
parse_package_json() {
    local jq_query="$1"
    local default_value="$2"
    local field_name="$3"
    local is_required="${4:-false}"
    
    # Verify jq is available before attempting to parse
    if ! command -v jq &> /dev/null; then
        error "jq is required but not installed"
        echo ""
        info "jq is a lightweight JSON processor needed to parse package.json"
        echo ""
        info "Install jq using your package manager:"
        echo "  • Ubuntu/Debian:  sudo apt-get install jq"
        echo "  • Fedora/RHEL:    sudo dnf install jq"
        echo "  • Arch/Manjaro:   sudo pacman -S jq"
        echo "  • macOS:          brew install jq"
        echo ""
        info "After installing jq, re-run this script"
        exit 1
    fi
    
    # Verify package.json exists and is readable
    if [ ! -r "package.json" ]; then
        error "Cannot read package.json file"
        echo ""
        info "Ensure package.json exists and is readable in the current directory"
        exit 1
    fi
    
    local result
    
    # Attempt to parse with jq, coalescing null to empty string
    if ! result=$(jq -r "($jq_query) // empty" package.json 2>&1); then
        error "Failed to parse $field_name from package.json"
        echo ""
        info "jq error: $result"
        echo ""
        info "Common causes:"
        echo "  • Malformed JSON syntax in package.json"
        echo "  • Invalid jq query expression"
        echo "  • Corrupted package.json file"
        echo ""
        info "Troubleshooting steps:"
        echo "  1. Validate package.json syntax:"
        echo "     jq . package.json"
        echo ""
        echo "  2. Check for common JSON errors:"
        echo "     • Missing commas between properties"
        echo "     • Trailing commas after last property"
        echo "     • Unmatched brackets or braces"
        echo "     • Invalid escape sequences in strings"
        echo ""
        echo "  3. If package.json is corrupted, restore it:"
        echo "     git checkout package.json"
        echo ""
        info "Documentation: https://github.com/PalisadoesFoundation/talawa-api/blob/develop/INSTALLATION.md"
        exit 1
    fi
    
    # Check for empty results
    if [ -z "$result" ]; then
        if [ "$is_required" = "true" ]; then
            error "$field_name not found in package.json (required field)"
            echo ""
            info "The field '$field_name' is required but was not found or is null"
            echo ""
            info "Expected location in package.json: $jq_query"
            echo ""
            info "Troubleshooting steps:"
            echo "  1. Check if the field exists in package.json:"
            echo "     jq '$jq_query' package.json"
            echo ""
            echo "  2. Ensure you have the latest version of the repository:"
            echo "     git pull origin develop"
            echo ""
            info "Report issues: https://github.com/PalisadoesFoundation/talawa-api/issues"
            exit 1
        fi
        
        # Use default value if provided
        if [ -n "$default_value" ]; then
            echo "$default_value"
            return 0
        fi
        
        # Return empty string if no default and not required
        echo ""
        return 0
    fi
    
    # Return the successfully parsed result
    echo "$result"
}

##############################################################################
# handle_version_validation_error - Validation error handler for version strings
##############################################################################
handle_version_validation_error() {
    local field_name="$1"
    local current_value="$2"
    local jq_path="${3:-}"
    
    error "Security validation failed for $field_name"
    echo ""
    info "The value in package.json contains invalid characters."
    echo ""
    info "Current value: '$current_value'"
    echo ""
    info "This could indicate:"
    echo "  • Corrupted package.json file"
    echo "  • Potentially malicious version string"
    echo "  • Typo or formatting error"
    echo ""
    info "Troubleshooting steps:"
    echo "  1. Check the field in package.json:"
    if [ -n "$jq_path" ]; then
        echo "     jq '${jq_path}' package.json"
    else
        echo "     Check the relevant field manually in package.json"
    fi
    echo ""
    echo "  2. Restore package.json if corrupted:"
    echo "     git checkout package.json"
    echo ""
    echo "  3. Ensure version follows semver format (e.g., 18.0.0, ^18.0.0)"
    echo ""
    info "Report issues: https://github.com/PalisadoesFoundation/talawa-api/issues"
    exit 1
}

##############################################################################
# retry_command - Retry command with exponential backoff
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
        
        # Run command and capture exit code immediately
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
# NEW: Repository Root Validation
#
# Ensures the script is executed from the project root.
##############################################################################
validate_repository_root() {
    # Check if debug function exists, otherwise ignore
    if declare -F debug >/dev/null; then debug "Validating repository root..."; fi

    if [ -e ".git" ] && [ -f "package.json" ]; then
        success "Repository root validated"
        return 0
    fi

    error "Not at repository root (.git and package.json required)"
    return 1
}

##############################################################################
# NEW: Disk Space Validation
#
# Checks that sufficient disk space is available.
# Usage: validate_disk_space <min_mb> (Default: 2000 MB)
##############################################################################
validate_disk_space() {
    local min_mb="${1:-2000}"
    if declare -F debug >/dev/null; then debug "Checking for at least ${min_mb}MB free disk space..."; fi

    local avail_kb
    avail_kb="$(df -Pk . 2>/dev/null | awk 'NR==2 {print $4}')"

    # Guard against empty or non-numeric output
    if [ -z "$avail_kb" ] || ! [[ "$avail_kb" =~ ^[0-9]+$ ]]; then
        error "Unable to determine available disk space"
        return 1
    fi

    local avail_mb=$((avail_kb / 1024))

    if [ "$avail_mb" -ge "$min_mb" ]; then
        success "Disk space OK: ${avail_mb}MB available (Required: ${min_mb}MB)"
        return 0
    fi

    error "Insufficient disk space: ${avail_mb}MB available (Minimum: ${min_mb}MB)"
    return 1
}

##############################################################################
# Secure validators
#
# Stricter validators for version strings (x.y or x.y.z only) and paths.
##############################################################################

##############################################################################
# validate_version_string_secure - Strict version string (x.y or x.y.z only)
##############################################################################
validate_version_string_secure() {
    local v="${1:-}"

    local pattern='^[0-9]+(\.[0-9]+){1,2}$'
    if [[ "$v" =~ $pattern ]]; then
        success "Version OK: $v"
        return 0
    fi

    error "Invalid version: $v (expected x.y or x.y.z)"
    return 1
}

##############################################################################
# NEW: Internet Connectivity Validation
#
# Verifies connectivity to required external services.
##############################################################################
validate_internet_connectivity() {
    if declare -F debug >/dev/null; then debug "Checking internet connectivity..."; fi

    local hosts=("github.com" "registry.npmjs.org")
    # Soft-fail policy: installation proceeds if at least one required host is reachable
    # to avoid blocking installation due to temporary service outages
    local any_ok=0

    for host in "${hosts[@]}"; do
        local host_ok=0

        if command -v curl >/dev/null 2>&1; then
            if curl -sSf --max-time 5 "https://${host}" >/dev/null 2>&1; then
                host_ok=1
            fi
        
        elif command -v ping >/dev/null 2>&1; then
            if command -v timeout >/dev/null 2>&1; then
                if timeout 5s ping -c 1 "$host" >/dev/null 2>&1; then
                    host_ok=1
                fi
            else
                # Platform-specific ping timeout handling
                case "$(uname -s)" in
                    Linux*)
                        ping -c 1 -W 3 "$host" >/dev/null 2>&1 && host_ok=1
                        ;;
                    Darwin*|FreeBSD*)
                        ping -c 1 -W 3000 "$host" >/dev/null 2>&1 && host_ok=1
                        ;;
                    *)
                        ping -c 1 "$host" >/dev/null 2>&1 && host_ok=1
                        ;;
                esac
            fi

        else
            warn "Neither curl nor ping is available to test connectivity"
        fi

        if [ "$host_ok" -eq 1 ]; then
            success "Connection to ${host} verified"
            any_ok=1
        else
            warn "Unable to reach ${host}"
        fi
    done

    if [ "$any_ok" -eq 1 ]; then
        return 0
    fi

    error "Internet connectivity check failed"
    return 1
}

##############################################################################
# NEW: Aggregate Prerequisite Validation
#
# Runs all system pre-flight checks and aggregates results.
##############################################################################
validate_prerequisites() {
    info "Running system pre-flight checks..."
    local rc=0

    validate_repository_root || rc=1
    validate_disk_space 2000 || rc=1
    validate_internet_connectivity || rc=1

    if [ "$rc" -eq 0 ]; then
        success "All prerequisites met"
    else
        error "Prerequisites check failed"
    fi

    return "$rc"
}

##############################################################################
# validate_path - Absolute path with no traversal or unsafe characters
##############################################################################
validate_path() {
    local p="${1:-}"

    case "$p" in
        /*) ;;
        *)
            error "Path must be absolute: $p"
            return 1
            ;;
    esac

    # Reject root "/" — operations on root are risky; require at least one path component
    if [[ "$p" = "/" ]]; then
        error "Root path not allowed: $p"
        return 1
    fi

    # Only reject ".." as a path component (e.g. /tmp/../etc)
    local traversal_pattern='(^|/)\.\.($|/)'
    if [[ "$p" =~ $traversal_pattern ]]; then
        error "Path traversal not allowed: $p"
        return 1
    fi

    # Require at least one path component; reject shell metacharacters
    local safe_path_pattern='^/[a-zA-Z0-9/._-]+$'
    if [[ ! "$p" =~ $safe_path_pattern ]]; then
        error "Path contains unsafe characters: $p"
        return 1
    fi

    success "Path OK: $p"
    return 0
}

##############################################################################
# run_cmd - Safe command execution with dry-run support
##############################################################################
DRY_RUN="${DRY_RUN:-0}"

run_cmd() {
    if [ "${DRY_RUN:-0}" = "1" ]; then
        printf "[INFO] (dry-run) %s\n" "$*"
        return 0
    fi
    "$@"
}
