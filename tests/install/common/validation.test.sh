#!/bin/bash

##############################################################################
# validation.test.sh - Talawa API Validation Functions Test Suite
#
# Validates the security-critical validation functions to prevent command
# injection and ensure proper version string, path, and run_cmd behavior.
#
# Usage: ./validation.test.sh
# Returns: 0 if all tests pass, 1 if any test fails
# Requirements: bash 4.0+
##############################################################################

# Do not use set -e: many tests intentionally run failing commands (e.g. run_cmd false)
# and assert on the exit code; set -e would exit the script on those.
set -u  # Catch undefined variables

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
success() { echo -e "${GREEN}✓${NC} $1"; }

# Source the validation functions (scripts live under scripts/install when tests run from tests/install)
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
SCRIPTS_INSTALL="$REPO_ROOT/scripts/install"
# Clean /tmp/retry_test_$$ on exit (used by retry_command test)
trap 'rm -f "/tmp/retry_test_$$"' EXIT
source "$SCRIPTS_INSTALL/common/validation.sh"

##############################################################################
# Test framework functions
#
# test_start - Start a test and print its name; increments TESTS_RUN.
# Usage: test_start "test name"
#
# test_pass - Record a passing test; increments TESTS_PASSED.
# Usage: test_pass
#
# test_fail - Record a failing test with reason; increments TESTS_FAILED.
# Usage: test_fail "reason message"
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
# Test: Guard fails when success() is missing
##############################################################################

test_start "Guard fails when success() is omitted (subshell exits non-zero, stderr contains guard message)"
set +e
guard_stderr=$( (
    info() { :; }
    warn() { :; }
    error() { :; }
    unset -f success 2>/dev/null || true
    source "$SCRIPTS_INSTALL/common/validation.sh"
) 2>&1 )
guard_exitcode=$?
if [ "$guard_exitcode" -ne 0 ] && echo "$guard_stderr" | grep -q "requires info(), warn(), error(), and success() functions to be defined"; then
    test_pass
else
    test_fail "Expected subshell to exit non-zero with guard message; exitcode=$guard_exitcode"
fi

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

test_start "validate_version_string_secure helper exists and is callable"
if declare -F validate_version_string_secure >/dev/null 2>&1; then
    test_pass
else
    test_fail "validate_version_string_secure function not found"
fi

test_start "validate_path helper exists and is callable"
if declare -F validate_path >/dev/null 2>&1; then
    test_pass
else
    test_fail "validate_path function not found"
fi

test_start "run_cmd helper exists and is callable"
if declare -F run_cmd >/dev/null 2>&1; then
    test_pass
else
    test_fail "run_cmd function not found"
fi

##############################################################################
# Test: validate_version_string_secure() - Valid versions
##############################################################################

test_valid_version_secure() {
    local version="$1"
    local description="$2"

    test_start "Valid version (secure): $description ($version)"

    if validate_version_string_secure "$version" &>/dev/null; then
        test_pass
    else
        test_fail "Expected version '$version' to be valid"
    fi
}

test_valid_version_secure "1.0" "x.y"
test_valid_version_secure "2.3" "x.y"
test_valid_version_secure "1.2.3" "x.y.z"

##############################################################################
# Test: validate_version_string_secure() - Invalid versions
##############################################################################

test_invalid_version_secure() {
    local version="$1"
    local description="$2"

    test_start "Invalid version (secure, should reject): $description"

    if validate_version_string_secure "$version" &>/dev/null; then
        test_fail "Expected version '$version' to be rejected"
    else
        test_pass
    fi
}

test_invalid_version_secure "" "empty string"
test_invalid_version_secure "1" "single number"
test_invalid_version_secure "1.2.3.4" "four segments"
test_invalid_version_secure "1.2.3-beta" "prerelease"
test_invalid_version_secure "^1.0" "caret"
test_invalid_version_secure "1.0; rm -rf /" "command injection"
test_invalid_version_secure "1.0 2.0" "spaces"

##############################################################################
# Test: validate_path() - Valid paths
##############################################################################

test_valid_path() {
    local path="$1"
    local description="$2"

    test_start "Valid path: $description ($path)"

    if validate_path "$path" &>/dev/null; then
        test_pass
    else
        test_fail "Expected path '$path' to be valid"
    fi
}

test_valid_path "/tmp" "tmp"
test_valid_path "/home/user/app" "absolute path"
test_valid_path "/tmp/file..bak" "consecutive dots in filename (legitimate)"

##############################################################################
# Test: validate_path() - Invalid paths
##############################################################################

test_invalid_path() {
    local path="$1"
    local description="$2"

    test_start "Invalid path (should reject): $description"

    if validate_path "$path" &>/dev/null; then
        test_fail "Expected path '$path' to be rejected"
    else
        test_pass
    fi
}

test_invalid_path "/" "root (operations on root are risky)"
test_invalid_path "./foo" "relative with dot"
test_invalid_path "foo" "relative"
test_invalid_path "/tmp/../etc" "path traversal"
test_invalid_path "" "empty string"

# Reject paths containing shell metacharacters and unsafe characters
test_invalid_path '/tmp/foo;rm -rf /' "contains semicolon"
test_invalid_path '/tmp/foo|ls' "pipe"
test_invalid_path '/tmp/$(rm -rf /)' "command substitution"
test_invalid_path '/tmp/foo`out' "backtick"
test_invalid_path '/tmp/foo&' "background ampersand"
test_invalid_path '/tmp/foo>out' "redirection"
test_invalid_path '/tmp/foo<in' "input redirection"
test_invalid_path '/tmp/foo*' "glob asterisk"
test_invalid_path '/tmp/foo?' "glob question mark"
test_invalid_path $'/tmp/foo\'out' "single quote"
test_invalid_path '/tmp/foo"out' "double quote"
test_invalid_path '/tmp/foo\out' "backslash"
test_invalid_path '/tmp/foo out' "space"

##############################################################################
# Test: run_cmd() and DRY_RUN
##############################################################################

test_start "run_cmd with DRY_RUN=1 prints command and does not execute"
# Use a temp file to verify run_cmd does NOT actually execute when DRY_RUN=1
TMPFILE=$(mktemp -u)
output=$(DRY_RUN=1 run_cmd touch "$TMPFILE" 2>&1)
if ! echo "$output" | grep -q "dry-run" || ! echo "$output" | grep -q "touch"; then
    test_fail "Expected dry-run message and command in output, got: $output"
elif [ -e "$TMPFILE" ]; then
    test_fail "DRY_RUN=1 must not execute: file was created: $TMPFILE"
else
    test_pass
fi

test_start "run_cmd with DRY_RUN=0 executes command"
if DRY_RUN=0 run_cmd true &>/dev/null; then
    test_pass
else
    test_fail "Expected run_cmd to execute command and return 0"
fi

test_start "run_cmd propagates exit code on command failure"
if DRY_RUN=0 run_cmd false &>/dev/null; then
    test_fail "Expected run_cmd to return non-zero when command fails"
else
    test_pass
fi

# Default DRY_RUN fallback (${DRY_RUN:-0}): unset DRY_RUN and assert run_cmd executes and propagates exit codes
test_start "run_cmd with DRY_RUN unset executes command (default like DRY_RUN=0)"
if unset DRY_RUN; run_cmd true &>/dev/null; then
    test_pass
else
    test_fail "Expected run_cmd to execute command when DRY_RUN is unset"
fi

test_start "run_cmd with DRY_RUN unset propagates exit code on failure"
if unset DRY_RUN; run_cmd false &>/dev/null; then
    test_fail "Expected run_cmd to return non-zero when DRY_RUN unset and command fails"
else
    test_pass
fi

##############################################################################
# Test: parse_package_json() - Functional tests
##############################################################################

# Check if jq is available before running parse_package_json tests
if command -v jq &> /dev/null; then
    test_parse_package_json_functional() {
        local test_name="$1"
        local expected_result="$2"
        
        test_start "parse_package_json: $test_name"
        
        # Create temporary directory and package.json for testing
        # Separate declaration from assignment to avoid masking return values (SC2155)
        local temp_dir
        temp_dir=$(mktemp -d)
        local original_dir
        original_dir=$(pwd)
        
        cd "$temp_dir"
        
        local result
        case "$test_name" in
            "parses valid engines.node field")
                echo '{"engines":{"node":"18.0.0"}}' > package.json
                result=$(parse_package_json ".engines.node" "" "engines.node" false 2>&1)
                ;;
            "parses valid packageManager field")
                echo '{"packageManager":"pnpm@10.2.1"}' > package.json
                result=$(parse_package_json ".packageManager" "" "packageManager" false 2>&1)
                ;;
            "returns default for missing optional field")
                echo '{}' > package.json
                result=$(parse_package_json ".engines.node" "lts" "engines.node" false 2>&1)
                ;;
            "returns default for null value")
                echo '{"engines":{"node":null}}' > package.json
                result=$(parse_package_json ".engines.node" "lts" "engines.node" false 2>&1)
                ;;
            "handles nested fields correctly")
                echo '{"config":{"version":"1.2.3"}}' > package.json
                result=$(parse_package_json ".config.version" "" "config.version" false 2>&1)
                ;;
        esac
        
        cd "$original_dir"
        rm -rf "$temp_dir"
        
        # Check if result matches expected (only check first line for actual result)
        local first_line
        first_line=$(echo "$result" | head -n1)
        if [ "$first_line" = "$expected_result" ]; then
            test_pass
        else
            test_fail "Expected '$expected_result', got '$first_line'"
        fi
    }

    test_parse_package_json_functional "parses valid engines.node field" "18.0.0"
    test_parse_package_json_functional "parses valid packageManager field" "pnpm@10.2.1"
    test_parse_package_json_functional "returns default for missing optional field" "lts"
    test_parse_package_json_functional "returns default for null value" "lts"
    test_parse_package_json_functional "handles nested fields correctly" "1.2.3"

    test_parse_package_json_required_field_error() {
        test_start "parse_package_json: required field missing triggers error"
        local temp_dir
        local original_dir
        temp_dir=$(mktemp -d)
        original_dir=$(pwd)
        cd "$temp_dir"
        echo '{}' > package.json
        if (parse_package_json ".engines.node" "" "engines.node" true 2>&1 | grep -q "engines.node not found in package.json (required field)"); then
            test_pass
        else
            test_fail "Expected required field error when engines.node is missing"
        fi
        cd "$original_dir"
        rm -rf "$temp_dir"
    }

    test_parse_package_json_required_field_error
else
    # Skip tests if jq is not available
    test_start "parse_package_json: functional tests (skipped - jq not available)"
    warn "Skipping parse_package_json functional tests: jq is not installed"
    test_pass
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
# Test: validate_repository_root()
##############################################################################

test_start "validate_repository_root succeeds at repo root"
(
    cd "$REPO_ROOT" || exit 1
    if validate_repository_root &>/dev/null; then
        exit 0
    else
        exit 1
    fi
)
if [ $? -eq 0 ]; then
    test_pass
else
    test_fail "Expected validate_repository_root to succeed at repo root"
fi


test_start "validate_repository_root fails outside repo root"
(
    temp_dir=$(mktemp -d)
    trap 'rm -rf "$temp_dir"' EXIT
    cd "$temp_dir" || exit 1
    
    if validate_repository_root &>/dev/null; then
        rc=1
    else
        rc=0
    fi
    
    cd / || true
    rm -rf "$temp_dir"
    exit "$rc"
)
if [ $? -eq 0 ]; then
    test_pass
else
    test_fail "Expected validate_repository_root to fail outside repo root"
fi

##############################################################################
# Test: validate_disk_space()
##############################################################################

test_start "validate_disk_space succeeds with low minimum"
if validate_disk_space 1 &>/dev/null; then
    test_pass
else
    test_fail "Expected validate_disk_space to succeed with low threshold"
fi

test_start "validate_disk_space fails with unrealistic requirement"
if validate_disk_space 99999999 &>/dev/null; then
    test_fail "Expected validate_disk_space to fail with high threshold"
else
    test_pass
fi

##############################################################################
# Test: validate_disk_space() with mocked df output
##############################################################################

test_start "validate_disk_space succeeds when df reports enough space"
(
    df() {
        echo -e "Filesystem 1024-blocks Used Available Capacity Mounted\n/dev 10000000 1 5000000 1% /"
    }
    export -f df

    validate_disk_space 4000 &>/dev/null
)
[ $? -eq 0 ] && test_pass || test_fail "Expected success when available space >= min_mb"


test_start "validate_disk_space succeeds when available space equals min_mb (boundary)"
(
    df() {
        echo -e "Filesystem 1024-blocks Used Available Capacity Mounted\n/dev 10000000 1 2048000 1% /"
    }
    export -f df

    validate_disk_space 2000 &>/dev/null
)
[ $? -eq 0 ] && test_pass || test_fail "Expected success at boundary"


test_start "validate_disk_space fails when df reports insufficient space"
(
    df() {
        echo -e "Filesystem 1024-blocks Used Available Capacity Mounted\n/dev 10000000 1 1000 1% /"
    }
    export -f df

    ! validate_disk_space 4000 &>/dev/null
)
[ $? -eq 0 ] && test_pass || test_fail "Expected failure when space insufficient"


test_start "validate_disk_space fails when df output is non-numeric"
(
    df() { echo "nonsense output"; }
    export -f df

    ! validate_disk_space 1 &>/dev/null
)
[ $? -eq 0 ] && test_pass || test_fail "Expected failure on non-numeric df output"

##############################################################################
# Test: validate_internet_connectivity()
##############################################################################

test_start "validate_internet_connectivity succeeds when curl succeeds"
(
    curl() { return 0; }
    ping() { return 1; }
    export -f curl ping

    validate_internet_connectivity &>/dev/null
)
[ $? -eq 0 ] && test_pass || test_fail "Expected connectivity success"


test_start "validate_internet_connectivity fails when curl fails"
(
    curl() { return 1; }
    ping() { return 1; }
    export -f curl ping

    ! validate_internet_connectivity &>/dev/null
)
[ $? -eq 0 ] && test_pass || test_fail "Expected connectivity failure"


test_start "validate_internet_connectivity succeeds when curl missing but ping succeeds"
(
    # Hide curl so script uses ping path; ping is mocked to succeed
    command() {
        if [ "$1" = "-v" ] && [ "$2" = "curl" ]; then
            return 1
        fi
        builtin command "$@"
    }
    export -f command
    ping() { return 0; }
    export -f ping

    validate_internet_connectivity &>/dev/null
)
[ $? -eq 0 ] && test_pass || test_fail "Expected success via ping"


test_start "validate_internet_connectivity fails when neither curl nor ping available"
(
    unset -f curl ping 2>/dev/null || true

    command() {
        if [ "$2" = "curl" ] || [ "$2" = "ping" ]; then
            return 1
        fi
        /usr/bin/command "$@"
    }
    export -f command

    ! validate_internet_connectivity &>/dev/null
)
[ $? -eq 0 ] && test_pass || test_fail "Expected failure without network tools"

##############################################################################
# Test: validate_prerequisites()
##############################################################################

test_start "validate_prerequisites succeeds when all checks pass"
(
    validate_repository_root() { return 0; }
    validate_disk_space() { return 0; }
    validate_internet_connectivity() { return 0; }
    export -f validate_repository_root validate_disk_space validate_internet_connectivity

    validate_prerequisites &>/dev/null
)
[ $? -eq 0 ] && test_pass || test_fail "Expected prerequisites to succeed"


test_start "validate_prerequisites fails when disk space fails"
(
    validate_repository_root() { return 0; }
    validate_disk_space() { return 1; }
    validate_internet_connectivity() { return 0; }
    export -f validate_repository_root validate_disk_space validate_internet_connectivity

    ! validate_prerequisites &>/dev/null
)
[ $? -eq 0 ] && test_pass || test_fail "Expected failure when disk fails"


test_start "validate_prerequisites fails when repository validation fails"
(
    validate_repository_root() { return 1; }
    validate_disk_space() { return 0; }
    validate_internet_connectivity() { return 0; }
    export -f validate_repository_root validate_disk_space validate_internet_connectivity

    ! validate_prerequisites &>/dev/null
)
[ $? -eq 0 ] && test_pass || test_fail "Expected failure when repo check fails"


test_start "validate_prerequisites fails when internet validation fails"
(
    validate_repository_root() { return 0; }
    validate_disk_space() { return 0; }
    validate_internet_connectivity() { return 1; }
    export -f validate_repository_root validate_disk_space validate_internet_connectivity

    ! validate_prerequisites &>/dev/null
)
[ $? -eq 0 ] && test_pass || test_fail "Expected failure when internet fails"

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

if [ "$TESTS_FAILED" -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
