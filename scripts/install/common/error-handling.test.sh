#!/bin/bash

##############################################################################
# Talawa API - Error Handling Library Test Suite
#
# This test suite validates the error handling, cleanup, and idempotency logic.
#
# Usage: ./error-handling.test.sh
##############################################################################

set -u # Don't set -e globally to allow testing failure scenarios

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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
    echo -e "${GREEN}✓ PASS${NC}"
}

test_fail() {
    local message="$1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo -e "${RED}✗ FAIL${NC}"
    echo -e "  ${RED}Reason: $message${NC}"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_PATH="$SCRIPT_DIR/error-handling.sh"

##############################################################################
# Test: Cleanup Stack (LIFO)
##############################################################################
test_cleanup_lifo() {
    test_start "Cleanup tasks execute in LIFO order"
    
    local output
    output=$(bash -c "source '$LIB_PATH'; \
        register_cleanup_task 'echo \"Task 1\"'; \
        register_cleanup_task 'echo \"Task 2\"'; \
        cleanup_on_error" 2>&1)
    
    # Check if Task 2 appears before Task 1
    local t1_pos=$(echo "$output" | grep -n "Task 1" | cut -d: -f1)
    local t2_pos=$(echo "$output" | grep -n "Task 2" | cut -d: -f1)
    
    if [ -n "$t1_pos" ] && [ -n "$t2_pos" ] && [ "$t2_pos" -lt "$t1_pos" ]; then
        test_pass
    else
        test_fail "Expected Task 2 before Task 1. Output:\n$output"
    fi
}

##############################################################################
# Test: Idempotency
##############################################################################
test_idempotency() {
    test_start "run_idempotent skips completed tasks"
    
    # We need a temporary directory for state to avoid messing with real state
    local tmp_home=$(mktemp -d)
    
    local output
    output=$(TMPDIR="$tmp_home" bash -c "source '$LIB_PATH'; \
        run_idempotent 'step1' echo 'Running Step 1'; \
        run_idempotent 'step1' echo 'Running Step 1 Again'")
    
    rm -rf "$tmp_home"
    
    # Count occurrences of "Running Step 1"
    local count=$(echo "$output" | grep -c "Running Step 1")
    
    # It should appear once (ignoring the "Again" part which shouldn't run)
    if echo "$output" | grep -q "Skipping already-completed step: step1" && \
       [ "$count" -eq 1 ]; then
        test_pass
    else
        test_fail "Expected step to run once and skip once. Output:\n$output"
    fi
}

##############################################################################
# Test: Signal Trapping
##############################################################################
test_trap_err() {
    test_start "ERR signal triggers cleanup"
    
    local output
    output=$(bash -c "source '$LIB_PATH'; \
        setup_error_handling; \
        register_cleanup_task 'echo \"Cleanup Executed\"'; \
        false" 2>&1) # 'false' triggers ERR
        
    if echo "$output" | grep -q "Cleanup Executed"; then
        test_pass
    else
        test_fail "Cleanup did not execute on error. Output:\n$output"
    fi
}

##############################################################################
# Test: Directory Permissions
##############################################################################
test_dir_perms() {
    test_start "State directory has secure permissions (700)"
    
    local tmp_home=$(mktemp -d)
    # Run source to trigger dir creation
    TMPDIR="$tmp_home" bash -c "source '$LIB_PATH'"
    
    # Find the state dir
    local state_dir=$(find "$tmp_home" -name "talawa-install-state*")
    
    # Check permissions
    # Use python for cross-platform reliability (Windows/Linux/Mac)
    # On Windows, permissions are tricky in git bash, so we might skip or check loosely
    # But let's try python first as it abstracts some of this.
    
    local perms
    if command -v python3 &>/dev/null; then
        perms=$(python3 -c "import os; print(oct(os.stat('$state_dir').st_mode)[-3:])")
    elif stat --version 2>&1 | grep -q GNU; then
        perms=$(stat -c %a "$state_dir")
    else
        # Fallback for Mac/BSD
        perms=$(stat -f %Lp "$state_dir" 2>/dev/null || echo "unknown")
    fi
    
    rm -rf "$tmp_home"
    
    if [ "$perms" = "700" ]; then
        test_pass
    else
        # On Windows (Git Bash), chmod might not work as expected or stat might report differently (e.g. 755 or 777)
        # If running on Windows, we might accept 755 or warn.
        if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OS" == "Windows_NT" ]]; then
             echo -e "${YELLOW}⚠ WARN: Permissions are $perms (Expected 700). Ignoring on Windows.${NC}"
             test_pass
        else
             test_fail "Expected permissions 700, got $perms"
        fi
    fi
}

# Run Tests
test_cleanup_lifo
test_idempotency
test_trap_err
test_dir_perms

# Summary
echo ""
echo "========================================================================"
echo "Test Summary"
echo "========================================================================"
echo "Total tests run:    $TESTS_RUN"
echo -e "Tests passed:       ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed:       ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    exit 0
else
    exit 1
fi
