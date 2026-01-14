#!/bin/bash

##############################################################################
# Talawa API - Validation Functions Test Suite
#
# This test suite validates the security-critical validation functions
# to prevent command injection and ensure proper version string handling.
#
# Usage: ./validation.test.sh
#
# Requirements: bash 4.0+
##############################################################################

set -e  # Exit on first failure

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test statistics
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Define required functions before sourcing validation.sh
info() { echo -e "${BLUE}ℹ${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }

# Source the validation functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/validation.sh"

##############################################################################
# Test framework functions
##############################################################################

test_start() {
    local test_name="$1"
    TESTS_RUN=$((TESTS_RUN + 1))
    echo -n "Test $TESTS_RUN: $test_name ... "
}

test_pass() {
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo -e "${GREEN}✓ PASS${NC}"
}

test_fail() {
    local message="$1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo -e "${RED}✗ FAIL${NC}"
    echo -e "  ${RED}Reason: $message${NC}"
}

##############################################################################
# Test: validate_version_string() - Valid versions should PASS
##############################################################################

test_valid_version() {
    local version="$1"
    local description="$2"
    
    test_start "Valid version: $description ($version)"
    
    # Suppress all output (stdout and stderr) during validation tests
    if validate_version_string "$version" "test-field" &>/dev/null; then
        test_pass
    else
        test_fail "Expected version '$version' to be valid"
    fi
}

# Test valid semver patterns
test_valid_version "18.0.0" "exact version"
test_valid_version "23.7.0" "exact version"
test_valid_version "^18.0.0" "caret range"
test_valid_version "~18.0.0" "tilde range"
test_valid_version ">=18.0.0" "greater than or equal"
test_valid_version ">18.0.0" "greater than"
test_valid_version "<=18.0.0" "less than or equal"
test_valid_version "<18.0.0" "less than"
test_valid_version "lts" "lts keyword"
test_valid_version "latest" "latest keyword"
test_valid_version "lts/latest" "lts/latest pattern"
test_valid_version "lts/gallium" "lts with codename"
test_valid_version "10.2.1" "pnpm version"
test_valid_version "1.0.0-alpha" "prerelease version"
test_valid_version "1.0.0-beta.1" "prerelease with number"

##############################################################################
# Test: validate_version_string() - Invalid versions should FAIL
##############################################################################

test_invalid_version() {
    local version="$1"
    local description="$2"
    
    test_start "Invalid version (should reject): $description"
    
    # Suppress all output (stdout and stderr) during validation tests
    if validate_version_string "$version" "test-field" &>/dev/null; then
        test_fail "Expected version '$version' to be rejected (security risk)"
    else
        test_pass
    fi
}

# Test command injection attempts
test_invalid_version "18.0.0; rm -rf /" "command injection with semicolon"
test_invalid_version "18.0.0 && rm -rf /" "command injection with &&"
test_invalid_version "18.0.0 || malicious" "command injection with ||"
test_invalid_version "18.0.0\$(whoami)" "command substitution with \$"
test_invalid_version "18.0.0\`whoami\`" "command substitution with backticks"
test_invalid_version "18.0.0 | cat /etc/passwd" "pipe injection"
test_invalid_version "18.0.0 > /tmp/exploit" "redirect injection"
test_invalid_version "18.0.0 < /etc/passwd" "input redirect"
test_invalid_version "18.0.0 & background" "background process"

# Test invalid characters
test_invalid_version "18.0.0 " "trailing space"
test_invalid_version " 18.0.0" "leading space"
test_invalid_version $'18.0.0\t' "tab character"
test_invalid_version $'18.0.0\n' "newline character"
test_invalid_version "18.0.0#comment" "hash/comment"
test_invalid_version "18.0.0*" "glob asterisk"
test_invalid_version "18.0.0?" "glob question mark"
test_invalid_version "18.0.0[1]" "glob bracket"
test_invalid_version "18.0.0{1}" "brace expansion"
test_invalid_version "18.0.0!" "exclamation mark"
test_invalid_version "18.0.0@latest" "at symbol (except in pnpm@)"
test_invalid_version "18.0.0%" "percent sign"
test_invalid_version "18.0.0^&" "caret with ampersand"

# Test option injection attempts
test_invalid_version "-18.0.0" "dash prefix (option injection)"
test_invalid_version "--version" "double dash (option injection)"

# Test empty/null values
test_invalid_version "" "empty string"
test_invalid_version "null" "null literal"

# Test non-version strings
test_invalid_version "not-a-version" "no numbers"
test_invalid_version "abc" "alphabetic only"

##############################################################################
# Test: Helper functions - Basic functionality
##############################################################################

test_start "parse_package_json helper exists and is callable"
if declare -F parse_package_json >/dev/null 2>&1; then
    test_pass
else
    test_fail "parse_package_json function not found"
fi

test_start "handle_version_validation_error helper exists and is callable"
if declare -F handle_version_validation_error >/dev/null 2>&1; then
    test_pass
else
    test_fail "handle_version_validation_error function not found"
fi

test_start "retry_command helper exists and is callable"
if declare -F retry_command >/dev/null 2>&1; then
    test_pass
else
    test_fail "retry_command function not found"
fi

##############################################################################
# Test: handle_version_validation_error() - Error formatting
##############################################################################

test_start "handle_version_validation_error formats error with jq_path"
# Run in subshell to prevent exit
if (handle_version_validation_error "test field" "bad value" ".test.path" 2>&1 | grep -q "jq '.test.path' package.json"); then
    test_pass
else
    test_fail "Expected jq command with provided path"
fi

test_start "handle_version_validation_error formats error without jq_path"
# Run in subshell to prevent exit
if (handle_version_validation_error "test field" "bad value" 2>&1 | grep -q "Check the relevant field manually"); then
    test_pass
else
    test_fail "Expected generic message when no jq_path provided"
fi

##############################################################################
# Test: retry_command() - Retry logic
##############################################################################

test_start "retry_command succeeds on first attempt"
if retry_command 3 true &>/dev/null; then
    test_pass
else
    test_fail "Expected retry_command to succeed with passing command"
fi

test_start "retry_command fails after max retries"
if ! retry_command 2 false &>/dev/null; then
    test_pass
else
    test_fail "Expected retry_command to fail with failing command"
fi

test_start "retry_command returns success after initial failure"
# Create a command that fails first time, succeeds second time
TEST_FILE="/tmp/retry_test_$$"
rm -f "$TEST_FILE"
if retry_command 3 bash -c "[ -f '$TEST_FILE' ] || { touch '$TEST_FILE'; false; }" &>/dev/null; then
    test_pass
    rm -f "$TEST_FILE"
else
    test_fail "Expected retry_command to succeed on second attempt"
    rm -f "$TEST_FILE"
fi

##############################################################################
# Test summary
##############################################################################

echo ""
echo "========================================================================"
echo "Test Summary"
echo "========================================================================"
echo "Total tests run:    $TESTS_RUN"
echo -e "Tests passed:       ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed:       ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo ""
    exit 1
fi
