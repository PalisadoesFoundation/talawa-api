#!/bin/bash

##############################################################################
# Talawa API - Package Manager Functions Test Suite
#
# This test suite validates the package management abstraction layer.
# It uses mocking to simulate macOS/Homebrew environments vs other OSs.
#
# Usage: ./package-manager.test.sh
#
# Requirements: bash 4.0+
##############################################################################

# set -e removed to allow explicit error handling
set +e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test statistics
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Define required logger functions (mocks) before sourcing package-manager.sh
info() { echo -e "${BLUE}ℹ${NC} $1"; }
warn() { echo -e "${RED}⚠${NC} $1"; } # Using RED for warn in tests to verify error paths easier
error() { echo -e "${RED}✗${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }

# Source the package manager functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# OS_TYPE must be set before sourcing package-manager.sh
OS_TYPE="test_mode"
source "$SCRIPT_DIR/package-manager.sh"

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
# Mocks setup
##############################################################################

# Mock brew command
brew() {
    # Check for failure trigger
    if [ "${FAIL_BREW:-false}" = "true" ]; then
        return 1
    fi
    
    local cmd="$1"
    shift
    
    case "$cmd" in
        "update")
            return 0
            ;;
        "list")
            # If checking --versions, verify package
            if [ "$1" = "--versions" ]; then
                 if [ "$2" = "installed-package" ]; then
                     return 0
                 else
                     return 1
                 fi
            fi
            ;;
        "install")
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

##############################################################################
# Test: update_package_index()
##############################################################################

test_start "update_package_index calls brew update on macOS"
OS_TYPE="macos"
# We check if it returns success (execution flow)
# In a real framework we'd assert spy call count, but here we run for safe execution
if update_package_index; then
    test_pass
else
    test_fail "Expected update_package_index to succeed on macOS"
fi

test_start "update_package_index is no-op on other OS"
OS_TYPE="linux"
if update_package_index; then
    test_pass
else
    test_fail "Expected update_package_index to succeed (no-op) on linux"
fi

##############################################################################
# Test: is_package_installed()
##############################################################################

test_start "is_package_installed checks homebrew on macOS (installed case)"
OS_TYPE="macos"
if is_package_installed "installed-package"; then
    test_pass
else
    test_fail "Expected package to be detected as installed"
fi

test_start "is_package_installed checks homebrew on macOS (missing case)"
OS_TYPE="macos"
if ! is_package_installed "missing-package"; then
    test_pass
else
    test_fail "Expected missing package to be detected as missing"
fi

test_start "is_package_installed falls back to command -v on other OS"
OS_TYPE="linux"
# 'ls' should be installed
if is_package_installed "ls"; then
    test_pass
else
    test_fail "Expected 'ls' to be detected by command -v"
fi

test_start "is_package_installed returns false for missing package on Linux"
OS_TYPE="linux"
if ! is_package_installed "missing-package-12345"; then
    test_pass
else
    test_fail "Expected missing package to be detected as missing on Linux"
fi

##############################################################################
# Test: install_package()
##############################################################################

test_start "install_package calls brew install on macOS (success)"
OS_TYPE="macos"
FAIL_BREW="false"
if install_package "some-package"; then
    test_pass
else
    test_fail "Expected install_package to succeed"
fi

test_start "install_package returns error if brew install fails"
OS_TYPE="macos"
FAIL_BREW="true"
# Suppress error output
if ! install_package "broken-package" >/dev/null 2>&1; then
    test_pass
else
    test_fail "Expected install_package to fail if brew install fails"
fi
FAIL_BREW="false" # Reset

test_start "install_package fails on non-macOS"
OS_TYPE="linux"
# Suppress warning output
if ! install_package "some-package" >/dev/null 2>&1; then
    test_pass
else
    test_fail "Expected install_package to fail on unsupported OS"
fi


##############################################################################
# Test: Unset OS_TYPE (Soft-fail behavior)
##############################################################################

test_start "Public functions fail gracefully when OS_TYPE is unset"
# Save current OS_TYPE
OLD_OS_TYPE="${OS_TYPE:-}"
# Unset OS_TYPE for this test
unset OS_TYPE

ALL_CHECKS_PASSED=true

# Suppress error output
# Test update_package_index
if update_package_index >/dev/null 2>&1; then
    ALL_CHECKS_PASSED=false
    echo "  update_package_index succeeded (expected failure with 1)"
else
    EXIT_CODE=$?
    if [ "$EXIT_CODE" -ne 1 ]; then
        ALL_CHECKS_PASSED=false
        echo "  update_package_index exited with $EXIT_CODE (expected 1)"
    fi
fi

# Test is_package_installed
if is_package_installed "some-package" >/dev/null 2>&1; then
    ALL_CHECKS_PASSED=false
    echo "  is_package_installed succeeded (expected failure with 1)"
else
    EXIT_CODE=$?
    if [ "$EXIT_CODE" -ne 1 ]; then
        ALL_CHECKS_PASSED=false
        echo "  is_package_installed exited with $EXIT_CODE (expected 1)"
    fi
fi

# Test install_package
if install_package "some-package" >/dev/null 2>&1; then
    ALL_CHECKS_PASSED=false
    echo "  install_package succeeded (expected failure with 1)"
else
    EXIT_CODE=$?
    if [ "$EXIT_CODE" -ne 1 ]; then
        ALL_CHECKS_PASSED=false
        echo "  install_package exited with $EXIT_CODE (expected 1)"
    fi
fi

if [ "$ALL_CHECKS_PASSED" = "true" ]; then
    test_pass
else
    test_fail "One or more public functions did not fail gracefully when OS_TYPE is unset"
fi

# Restore OS_TYPE for subsequent tests
OS_TYPE="${OLD_OS_TYPE}"

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
