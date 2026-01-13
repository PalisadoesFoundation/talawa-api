#!/bin/bash

##############################################################################
# Talawa API - Common Validation Functions
# 
# This file contains shared validation functions used by installation scripts
# across different platforms (Linux, macOS, etc.)
#
# Usage: Source this file at the beginning of installation scripts:
#        source "$(dirname "$0")/../common/validation.sh"
##############################################################################

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
    local jq_exit_code
    
    # Attempt to parse with jq, coalescing null to empty string
    # Using '// empty' ensures null values become empty strings rather than literal "null"
    result=$(jq -r "($jq_query) // empty" package.json 2>&1)
    jq_exit_code=$?
    
    # Check if jq command failed (malformed JSON or invalid query)
    if [ $jq_exit_code -ne 0 ]; then
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
