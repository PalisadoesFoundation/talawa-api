#!/bin/bash

##############################################################################
# Talawa API - Linux Install Script Test Suite
#
# Minimal test suite for scripts/install/linux/install-linux.sh.
# Verifies script exists, is executable, and has valid syntax.
# Additional tests (e2e or mocked) can be added here.
#
# Usage: ./install-linux.test.sh
# Requirements: bash 4.0+
##############################################################################

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
SCRIPTS_INSTALL="$REPO_ROOT/scripts/install"
LINUX_SCRIPT="$SCRIPTS_INSTALL/linux/install-linux.sh"

TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

test_start() {
    local test_name="$1"
    TESTS_RUN=$((TESTS_RUN + 1))
    echo -n "Test $TESTS_RUN: $test_name ... "
}

test_pass() {
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo "PASS"
}

test_fail() {
    local message="$1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo "FAIL"
    echo "  Reason: $message"
}

##############################################################################
# Test: Linux install script exists and is readable
##############################################################################
test_start "install-linux.sh exists and is readable"
if [ -f "$LINUX_SCRIPT" ] && [ -r "$LINUX_SCRIPT" ]; then
    test_pass
else
    test_fail "Script not found or not readable: $LINUX_SCRIPT"
fi

##############################################################################
# Test: Linux install script is executable
##############################################################################
test_start "install-linux.sh is executable"
if [ -x "$LINUX_SCRIPT" ]; then
    test_pass
else
    test_fail "Script not executable: $LINUX_SCRIPT"
fi

##############################################################################
# Test: Linux install script has valid bash syntax
##############################################################################
test_start "install-linux.sh has valid bash syntax"
if bash -n "$LINUX_SCRIPT" 2>/dev/null; then
    test_pass
else
    test_fail "bash -n failed (syntax error) for $LINUX_SCRIPT"
fi

##############################################################################
# Test summary
##############################################################################
echo ""
echo "========================================================================"
echo "Test Summary"
echo "========================================================================"
echo "Total tests run:    $TESTS_RUN"
echo "Tests passed:       $TESTS_PASSED"
echo "Tests failed:       $TESTS_FAILED"
echo ""

if [ "$TESTS_FAILED" -eq 0 ]; then
    echo "All tests passed!"
    exit 0
else
    echo "Some tests failed"
    exit 1
fi
