#!/bin/bash

##############################################################################
# Talawa API - OS Detection Test Suite
#
# This test suite validates the OS detection helper functions.
#
# Usage: ./os-detection.test.sh
#
# Requirements: bash 4.0+
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test statistics
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Source the os detection functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/os-detection.sh"

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
# Test Cases
##############################################################################

# Test 1: command_exists returns success for known command
test_start "command_exists returns success for known command (ls)"
if command_exists "ls"; then
    test_pass
else
    test_fail "Expected 'ls' to exist"
fi

# Test 2: command_exists returns failure for unknown command
test_start "command_exists returns failure for unknown command"
# Use a highly unlikely command name
UNKNOWN_CMD="no_such_command_$(date +%s)_$$"
if ! command_exists "$UNKNOWN_CMD"; then
    test_pass
else
    test_fail "Expected '$UNKNOWN_CMD' not to exist"
fi

##############################################################################
# Test Summary
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
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
