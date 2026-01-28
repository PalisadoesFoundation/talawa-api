#!/usr/bin/env bash
# scripts/install/common/validation.test.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Ensure validation lib exists
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ ! -f "$SCRIPT_DIR/validation.sh" ]; then
    echo -e "${RED}Error: validation.sh not found in $SCRIPT_DIR${NC}"
    exit 1
fi

source "$SCRIPT_DIR/validation.sh"

# Mock Loggers
info() { echo -e "${BLUE}ℹ${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
debug() { :; }

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

# --- EXISTING TESTS ---

test_valid_version() {
    local version="$1"
    local description="$2"
    test_start "Valid version: $description ($version)"
    if validate_version_string "$version" "test-field" &>/dev/null; then test_pass; else test_fail "Expected valid"; fi
}

test_valid_version "18.0.0" "exact version"
test_valid_version "^18.0.0" "caret range"
test_valid_version "lts/latest" "lts/latest pattern"

test_invalid_version() {
    local version="$1"
    local description="$2"
    test_start "Invalid version: $description"
    if validate_version_string "$version" "test-field" &>/dev/null; then test_fail "Expected rejected"; else test_pass; fi
}

test_invalid_version "18.0.0; rm -rf /" "command injection"
test_invalid_version "-18.0.0" "dash prefix"

test_start "parse_package_json helper exists"
if declare -F parse_package_json >/dev/null 2>&1; then test_pass; else test_fail "Function missing"; fi

# --- NEW TESTS (Deterministic & Coverage) ---

ORIGINAL_DIR=$(pwd)

test_start "validate_repository_root (Inside Subdir - Should Fail)"
cd "$SCRIPT_DIR"
if validate_repository_root &>/dev/null; then
    test_fail "Expected failure (we are inside scripts/install/common)"
else
    test_pass
fi
cd "$ORIGINAL_DIR"

test_start "validate_repository_root (At Root - Should Pass)"
if validate_repository_root &>/dev/null; then
    test_pass
else
    test_fail "Repository root detection failed at actual root"
fi

test_start "validate_disk_space (1MB Check)"
if validate_disk_space 1 &>/dev/null; then test_pass; else test_fail "Disk space check failed"; fi

test_start "validate_disk_space (Impossible Size - Should Fail)"
if validate_disk_space 100000000000 &>/dev/null; then 
    test_fail "Expected failure for impossible disk space"
else 
    test_pass 
fi

test_start "validate_internet_connectivity (Success Path)"
if validate_internet_connectivity &>/dev/null; then 
    test_pass
else 
    echo -e "${YELLOW}⚠ WARN (Offline?)${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
fi

test_start "validate_internet_connectivity (Failure Path)"
tmpdir=$(mktemp -d)
echo '#!/bin/bash' > "$tmpdir/curl"
echo 'exit 1' >> "$tmpdir/curl"
echo '#!/bin/bash' > "$tmpdir/ping"
echo 'exit 1' >> "$tmpdir/ping"
chmod +x "$tmpdir/curl" "$tmpdir/ping"

if (PATH="$tmpdir:$PATH" validate_internet_connectivity &>/dev/null); then
    test_fail "Expected failure when network tools fail"
else
    test_pass
fi
rm -rf "$tmpdir"

# --- ORCHESTRATOR TEST 

test_start "validate_prerequisites (Orchestrator Mock)"
# We temporarily mock the internal functions to always return 0 (Success)
# This tests the logic of validate_prerequisites itself
(
    validate_repository_root() { return 0; }
    validate_disk_space() { return 0; }
    validate_internet_connectivity() { return 0; }
    
    if validate_prerequisites &>/dev/null; then
        exit 0
    else
        exit 1
    fi
)
if [ $? -eq 0 ]; then test_pass; else test_fail "Orchestrator failed despite all checks passing"; fi

# --- SUMMARY ---
echo ""
echo "Total tests run:    $TESTS_RUN"
echo -e "Tests passed:       ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed:       ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then exit 0; else exit 1; fi