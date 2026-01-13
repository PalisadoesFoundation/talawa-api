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
        info "Rejected characters found: $(echo "$version" | tr -d 'a-zA-Z0-9./~^=<>-')"
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
