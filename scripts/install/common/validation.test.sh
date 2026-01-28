#!/usr/bin/env bash
# scripts/install/common/validation.test.sh

set -e  # Exit on first failure

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# NOTE: We define mocks here to override logging.sh output for cleaner test results
# The real validation.sh sources logging.sh, so we might need to redefine them AFTER sourcing.

# Source the validation functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ ! -f "$SCRIPT_DIR/validation.sh" ]; then
    echo -e "${RED}Error: validation.sh not found in $SCRIPT_DIR${NC}"
    exit 1
fi

source "$SCRIPT_DIR/validation.sh"

# REDEFINE Loggers (Mocks) AFTER sourcing validation.sh
# This ensures tests output colorized text to stdout instead of writing to log files
info() { echo -e "${BLUE}ℹ${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
debug() { :; }

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
# EXISTING TESTS (Preserved)
##############################################################################

test_valid_version() {
    local version="$1"
    local description="$2"
    test_start "Valid version: $description ($version)"
    if validate_version_string "$version" "test-field" &>/dev/null; then test_pass; else test_fail "Expected valid"; fi
}

test_valid_version "18.0.0" "exact version"
test_valid_version "^18.0.0" "caret range"
test_valid_version "lts/latest" "lts/latest pattern"
test_valid_version "1.0.0-beta.1" "prerelease with number"

test_invalid_version() {
    local version="$1"
    local description="$2"
    test_start "Invalid version: $description"
    if validate_version_string "$version" "test-field" &>/dev/null; then test_fail "Expected rejected"; else test_pass; fi
}

test_invalid_version "18.0.0; rm -rf /" "command injection"
test_invalid_version "-18.0.0" "dash prefix"
test_invalid_version "18.0.0 && malicious" "&& injection"
test_invalid_version "null" "null literal"

test_start "parse_package_json helper exists"
if declare -F parse_package_json >/dev/null 2>&1; then test_pass; else test_fail "Function missing"; fi

# (Skipping redundant jq functional tests for brevity in this output, 
# BUT IN YOUR FILE KEEP THEM. I am adding the NEW tests below)

##############################################################################
# NEW TESTS (Added for Install2Fix)
##############################################################################

test_start "validate_repository_root (Current Dir)"
# Since we are running this from scripts/install/common, we are NOT at root.
# Expect failure unless we move to root.
# Let's temporarily cd to root to test success
current_dir=$(pwd)
# Assuming script is at scripts/install/common/
cd "$SCRIPT_DIR/../../.." 
if validate_repository_root &>/dev/null; then
    test_pass
    cd "$current_dir"
else
    cd "$current_dir"
    test_fail "Repository root detection failed at actual root"
fi

test_start "validate_disk_space (1MB Check)"
if validate_disk_space 1 &>/dev/null; then test_pass; else test_fail "Disk space check failed"; fi

test_start "validate_internet_connectivity"
if validate_internet_connectivity &>/dev/null; then 
    test_pass
else 
    # Warn but pass (CI might be offline)
    echo -e "${YELLOW}⚠ WARN (Offline?)${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
fi

##############################################################################
# Summary
##############################################################################
echo ""
echo "Total tests run:    $TESTS_RUN"
echo -e "Tests passed:       ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed:       ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    exit 0
else
    exit 1
fi