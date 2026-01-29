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

# Remove set -e to handle test failures explicitly
set +e

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
    echo "✓ PASS"
}

test_fail() {
    local message="$1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo "✗ FAIL"
    echo "  Reason: $message"
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
# Test: Smoke Tests for OS Detection
##############################################################################

# Setup for mocking
setup_mock_files() {
    TEST_TEMP_DIR="$(mktemp -d)"
    export ETC_OS_RELEASE="$TEST_TEMP_DIR/os-release"
    export ETC_LSB_RELEASE="$TEST_TEMP_DIR/lsb-release"
    export PROC_VERSION="$TEST_TEMP_DIR/proc_version"
    export PROC_OSRELEASE="$TEST_TEMP_DIR/proc_osrelease"
}

cleanup_mock_files() {
    if [ -n "${TEST_TEMP_DIR:-}" ] && [ -d "$TEST_TEMP_DIR" ]; then
        rm -rf "$TEST_TEMP_DIR"
    fi
    unset ETC_OS_RELEASE ETC_LSB_RELEASE PROC_VERSION PROC_OSRELEASE
    unset -f uname sw_vers lsb_release cmd.exe 2>/dev/null || true
}

# Test detect_os
test_start "detect_os - linux"
setup_mock_files
uname() { echo "Linux"; }
if [ "$(detect_os)" = "linux" ]; then test_pass; else test_fail "Expected linux, got $(detect_os)"; fi
cleanup_mock_files

test_start "detect_os - macos"
setup_mock_files
uname() { echo "Darwin"; }
if [ "$(detect_os)" = "macos" ]; then test_pass; else test_fail "Expected macos, got $(detect_os)"; fi
cleanup_mock_files

# Test detect_distro (Ubuntu via os-release)
test_start "detect_distro - ubuntu"
setup_mock_files
uname() { echo "Linux"; }
echo 'ID=ubuntu' > "$ETC_OS_RELEASE"
if [ "$(detect_distro)" = "ubuntu" ]; then test_pass; else test_fail "Expected ubuntu, got $(detect_distro)"; fi
cleanup_mock_files

# Test detect_distro (Fedora via os-release)
test_start "detect_distro - fedora"
setup_mock_files
uname() { echo "Linux"; }
echo 'ID=fedora' > "$ETC_OS_RELEASE"
if [ "$(detect_distro)" = "fedora" ]; then test_pass; else test_fail "Expected fedora, got $(detect_distro)"; fi
cleanup_mock_files

# Test detect_distro_family (Debian)
test_start "detect_distro_family - debian"
setup_mock_files
uname() { echo "Linux"; }
echo 'ID=ubuntu' > "$ETC_OS_RELEASE"
if [ "$(detect_distro_family)" = "debian" ]; then test_pass; else test_fail "Expected debian, got $(detect_distro_family)"; fi
cleanup_mock_files

# Test detect_distro_family (RedHat)
test_start "detect_distro_family - redhat"
setup_mock_files
uname() { echo "Linux"; }
echo 'ID=rhel' > "$ETC_OS_RELEASE"
if [ "$(detect_distro_family)" = "redhat" ]; then test_pass; else test_fail "Expected redhat, got $(detect_distro_family)"; fi
cleanup_mock_files

# Test is_wsl
test_start "is_wsl - true"
setup_mock_files
echo "Linux version x.x.x-microsoft-standard-WSL2" > "$PROC_VERSION"
if is_wsl; then test_pass; else test_fail "Expected WSL detection"; fi
cleanup_mock_files

test_start "is_wsl - false"
setup_mock_files
if ! is_wsl; then test_pass; else test_fail "Expected no WSL detection"; fi
cleanup_mock_files

# Test get_os_version
test_start "get_os_version - linux"
setup_mock_files
uname() { echo "Linux"; }
echo 'VERSION_ID="20.04"' > "$ETC_OS_RELEASE"
if [ "$(get_os_version)" = "20.04" ]; then test_pass; else test_fail "Expected 20.04, got $(get_os_version)"; fi
cleanup_mock_files

# Test get_os_version (macOS)
test_start "get_os_version - macos"
setup_mock_files
uname() { echo "Darwin"; }
sw_vers() { echo "14.2.1"; }
if [ "$(get_os_version)" = "14.2.1" ]; then test_pass; else test_fail "Expected 14.2.1, got $(get_os_version)"; fi
cleanup_mock_files


##############################################################################
# Test Summary
##############################################################################

echo ""
echo "========================================================================"
echo "Test Summary"
echo "========================================================================"
echo "Total tests run:    $TESTS_RUN"
echo "Tests passed:       $TESTS_PASSED"
echo "Tests failed:       $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo "✓ All tests passed!"
    exit 0
else
    echo "✗ Some tests failed"
    exit 1
fi
