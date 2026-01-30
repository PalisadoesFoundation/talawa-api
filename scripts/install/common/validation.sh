#!/bin/bash

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
#   - info()   : For informational messages (blue output)
#   - warn()   : For warning messages (yellow output)
#   - error()  : For error messages (red output)
#   - success(): For success messages (green output); used by Secure validators below
#
#   Example definitions:
#     info() { echo -e "${BLUE}ℹ${NC} $1"; }
#     warn() { echo -e "${YELLOW}⚠${NC} $1"; }
#     error() { echo -e "${RED}✗${NC} $1"; }
#     success() { echo -e "${GREEN}✓${NC} $1"; }
##############################################################################

##############################################################################
# Guard: Verify required functions are defined
# 
# This library depends on info(), warn(), error(), and success() functions
# being defined by the calling script. Fail early with a clear message if
# they are missing. The Secure validators section (below) also uses success().
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
# Validate version strings to prevent command injection
# 
# This function validates version strings from package.json to prevent:
# - Command injection via malicious version strings (e.g., "18.0.0; rm -rf /")
# - Word splitting from spaces in version strings
# - Glob expansion from special characters
#
# Allowed characters: alphanumeric, dots, hyphens, carets, tildes, equals,
#                     greater than, less than, forward slash (covers semver patterns)
#
# Test cases (for regression testing):
#   Should PASS: "18.0.0", "^18.0.0", ">=18.0.0", "~18.0.0", "lts", "lts/latest"
#   Should FAIL: "18.0.0; rm -rf /", "18.0.0$(whoami)", "18.0.0 && malicious"
#
# Usage: validate_version_string "version" "field_name"
# Returns: 0 if valid, 1 if invalid
##############################################################################
validate_version_string() {
    local version="$1"
    local field_name="$2"
    
    # Check if version is empty or null
    if [ -z "$version" ] || [ "$version" = "null" ]; then
        error "Invalid $field_name: version string is empty or null"
        return 1
    fi
    
    # Reject versions starting with dash to prevent option injection (e.g., "-18.0.0" parsed as flag)
    if [[ "$version" =~ ^- ]]; then
        error "Invalid $field_name: '$version' (version cannot start with dash)"
        echo ""
        info "Version strings starting with '-' are rejected to prevent option injection"
        info "into package managers (fnm, npm, etc.)"
        return 1
    fi
    
    # Allow only: alphanumeric, dots, hyphens, carets, tildes, equals, greater/less than, forward slash
    # This covers semver patterns like: 18.0.0, ^18.0.0, ~18.0.0, >=18.0.0, lts, lts/latest
    # Pattern stored in variable to avoid shell interpretation issues
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
# Safe jq parsing helper function
# 
# This function provides robust jq parsing with:
# - Verification that jq is installed
# - Error handling for malformed JSON
# - Null/empty result handling with defaults
# - Clear error messages for debugging
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
    # Using '// empty' ensures null values become empty strings rather than literal "null"
    # Wrapped in if-statement to be errexit-safe (set -e won't abort before error handling)
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
    
    # Check for empty results (null values are coalesced to empty by jq)
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
# Validation error handler for version strings
# 
# This function provides standardized error output when version validation fails.
# Used to avoid code duplication across Linux and macOS installation scripts.
#
# Usage: handle_version_validation_error "field_name" "current_value" ["jq_path"]
# Arguments:
#   field_name:    Descriptive name shown to user (e.g., "Node.js version (engines.node)")
#   current_value: The invalid value that failed validation
#   jq_path:       (Optional) Valid jq path for the field (e.g., ".engines.node")
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
# Retry command with exponential backoff
# 
# This function retries a command multiple times with exponential backoff
# to handle transient network failures gracefully.
#
# Usage: retry_command max_attempts command [args...]
# Returns: 0 on success, last exit code on failure after all attempts
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
# Secure validators
#
# Stricter validators for version strings (x.y or x.y.z only) and paths
# (absolute, no traversal). Use validate_version_string_secure when you need
# a narrow whitelist; use validate_path before using user-provided paths.
##############################################################################

##############################################################################
# validate_version_string_secure - Strict version string (x.y or x.y.z only)
#
# Whitelist-only validation to prevent command injection. Rejects semver
# operators, prerelease tags, and any non-numeric/dot characters.
#
# Usage: validate_version_string_secure "version"
# Returns: 0 if valid (x.y or x.y.z), 1 if invalid
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
# validate_path - Absolute path with no traversal or unsafe characters
#
# Ensures path is absolute, does not contain ".." as a path component, and
# does not contain shell metacharacters or control characters. Use before
# using user-provided paths in file operations.
#
# Usage: validate_path "path"
# Returns: 0 if valid, 1 if invalid
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

    # Only reject ".." as a path component (e.g. /tmp/../etc), not consecutive dots in filenames (e.g. file..bak)
    local traversal_pattern='(^|/)\.\.($|/)'
    if [[ "$p" =~ $traversal_pattern ]]; then
        error "Path traversal not allowed: $p"
        return 1
    fi

    # Reject shell metacharacters, control characters, and whitespace (allow only / . - _ alphanumeric)
    local safe_path_pattern='^/[a-zA-Z0-9/._-]*$'
    if [[ ! "$p" =~ $safe_path_pattern ]]; then
        error "Path contains unsafe characters: $p"
        return 1
    fi

    success "Path OK: $p"
    return 0
}

##############################################################################
# DRY_RUN and run_cmd - Safe command execution with dry-run support
#
# run_cmd expects first argument as the command and the rest as its arguments.
# Uses "$@" (not eval) to avoid command injection; callers must pass trusted
# input only when using run_cmd.
##############################################################################
DRY_RUN="${DRY_RUN:-0}"

run_cmd() {
    if [ "$DRY_RUN" = "1" ]; then
        printf "[INFO] (dry-run) %s\n" "$*"
        return 0
    fi
    "$@"
}