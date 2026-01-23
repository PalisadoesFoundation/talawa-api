#!/bin/bash

##############################################################################
# Talawa API - Error Handling Library Test Suite
#
# This test suite validates the error handling, cleanup, and idempotency logic.
#
# Usage: ./error-handling.test.sh
##############################################################################

set -u # Don't set -e globally to allow testing failure scenarios

# Colors (Variables kept for structure but set to empty for plain text)
RED=''
GREEN=''
YELLOW=''
NC=''

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
    echo "✓ PASS"
}

test_fail() {
    local message="$1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo "✗ FAIL"
    echo "  Reason: $message"
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
    local t1_pos
    t1_pos=$(echo "$output" | grep -n "Task 1" | cut -d: -f1)
    local t2_pos
    t2_pos=$(echo "$output" | grep -n "Task 2" | cut -d: -f1)
    
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
    local tmp_home
    tmp_home=$(mktemp -d)
    
    local output
    output=$(TMPDIR="$tmp_home" bash -c "source '$LIB_PATH'; \
        run_idempotent 'step1' echo 'Running Step 1'; \
        run_idempotent 'step1' echo 'Running Step 1 Again'")
    
    rm -rf "$tmp_home"
    
    # Count occurrences of "Running Step 1"
    local count
    count=$(echo "$output" | grep -c "Running Step 1")
    
    # It should appear once (ignoring the "Again" part which shouldn't run)
    if echo "$output" | grep -q "Skipping already-completed step: step1" && \
       [ "$count" -eq 1 ]; then
        test_pass
    else
        test_fail "Expected step to run once and skip once. Output:\n$output"
    fi
}

test_idempotency_failure() {
    test_start "run_idempotent does not mark failed tasks as done"
    
    local tmp_home
    tmp_home=$(mktemp -d)
    
    # Run a failing command
    # We expect it to fail, so we ignore the exit code of bash -c with || true
    TMPDIR="$tmp_home" bash -c "source '$LIB_PATH'; \
        run_idempotent 'step_fail' false" > /dev/null 2>&1 || true
    
    # Check if the marker file exists (it should NOT)
    # The user-specific directory might vary, so we find it
    local state_dirs
    state_dirs=$(find "$tmp_home" -name "talawa-install-state*")
    
    local state_dir_count
    state_dir_count=$(echo "$state_dirs" | grep -c .)
    
    if [ "$state_dir_count" -ne 1 ]; then
        test_fail "Expected exactly 1 state directory, found $state_dir_count: $state_dirs"
        rm -rf "$tmp_home"
        return
    fi
    
    local marker="$state_dirs/step_fail.done"
    
    if [ ! -f "$marker" ]; then
        test_pass
    else
        test_fail "Marker file created for failed step: $marker"
    fi
    
    rm -rf "$tmp_home"
}

test_idempotency_args() {
    test_start "run_idempotent validates missing arguments"
    
    local output
    # Run with missing args
    output=$(bash -c "source '$LIB_PATH'; \
        run_idempotent 'only_one_arg'" 2>&1 || true)
        
    if echo "$output" | grep -q "requires at least 2 arguments"; then
        test_pass
    else
        test_fail "Expected argument validation error. Output:\n$output"
    fi
}

test_idempotency_empty_key() {
    test_start "run_idempotent validates empty key"

    local output
    # Run with empty key
    output=$(bash -c "source '$LIB_PATH'; \
        run_idempotent '' 'some_command'" 2>&1 || true)
        
    if echo "$output" | grep -q "requires at least 2 arguments"; then
        test_pass
    else
        test_fail "Expected validation error for empty key. Output:\n$output"
    fi
}

##############################################################################
# Test: Signal Trapping (ERR, INT, TERM)
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

test_trap_int() {
    test_start "INT signal (Ctrl+C) triggers cleanup"
    
    # Create a script that waits for SIGINT and registers a cleanup task
    local test_script
    test_script=$(mktemp)
    local output_file
    output_file=$(mktemp)
    
    cat <<EOF > "$test_script"
source '$LIB_PATH'
setup_error_handling
register_cleanup_task 'echo "INT Cleanup Executed"'
# Wait for signal (loop)
echo "Waiting..."
while true; do sleep 0.1; done
EOF
    
    # Run in background and redirect stdout/stderr to output file
    bash "$test_script" > "$output_file" 2>&1 &
    local pid=$!
    
    # Wait briefly for it to start
    sleep 0.5
    
    # Send SIGINT
    kill -INT $pid
    
    # Wait for process to finish
    wait $pid 2>/dev/null
    local exit_code=$?
    
    # Read output
    local output
    output=$(cat "$output_file")
    
    rm "$test_script"
    rm "$output_file"
    
    # Verify both cleanup execution AND exit code
    local cleanup_executed=0
    if echo "$output" | grep -q "INT Cleanup Executed"; then
        cleanup_executed=1
    fi
    
    if [ $cleanup_executed -eq 1 ] && [ $exit_code -eq 130 ]; then
        test_pass
    else
        test_fail "Cleanup Executed: $cleanup_executed, Exit Code: $exit_code (Expected 130). Output:\n$output"
    fi
}

test_trap_term() {
    test_start "TERM signal triggers cleanup"
    
    # Create a script that waits for SIGTERM and registers a cleanup task
    local test_script
    test_script=$(mktemp)
    local output_file
    output_file=$(mktemp)
    
    cat <<EOF > "$test_script"
source '$LIB_PATH'
setup_error_handling
register_cleanup_task 'echo "TERM Cleanup Executed"'
echo "Waiting..."
while true; do sleep 0.1; done
EOF
    
    # Run in background
    bash "$test_script" > "$output_file" 2>&1 &
    local pid=$!
    
    sleep 0.5
    
    # Send SIGTERM
    kill -TERM $pid
    
    wait $pid 2>/dev/null
    local exit_code=$?
    
    # Read output
    local output
    output=$(cat "$output_file")
    
    rm "$test_script"
    rm "$output_file"
    
    # Verify both cleanup execution AND exit code
    local cleanup_executed=0
    if echo "$output" | grep -q "TERM Cleanup Executed"; then
        cleanup_executed=1
    fi
    
    if [ $cleanup_executed -eq 1 ] && [ $exit_code -eq 143 ]; then
        test_pass
    else
        test_fail "Cleanup Executed: $cleanup_executed, Exit Code: $exit_code (Expected 143). Output:\n$output"
    fi
}

##############################################################################
# Test: Directory Permissions
##############################################################################
test_dir_perms() {
    test_start "State directory has secure permissions (700)"
    
    local tmp_home
    tmp_home=$(mktemp -d)
    # Run source to trigger dir creation
    TMPDIR="$tmp_home" bash -c "source '$LIB_PATH'"
    
    # Robustly find the state directory
    local state_dirs
    state_dirs=$(find "$tmp_home" -name "talawa-install-state*")
    local state_dir_count
    state_dir_count=$(echo "$state_dirs" | grep -c .)
    
    if [ "$state_dir_count" -eq 0 ]; then
        test_fail "State directory not created"
        rm -rf "$tmp_home"
        return
    elif [ "$state_dir_count" -gt 1 ]; then
        test_fail "Multiple state directories found: $state_dirs"
        rm -rf "$tmp_home"
        return
    fi
    
    local state_dir="$state_dirs"
    
    # Check permissions
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
        if [[ "${OSTYPE:-}" == "msys" || "${OSTYPE:-}" == "cygwin" || "${OS:-}" == "Windows_NT" ]]; then
             echo "⚠ WARN: Permissions are $perms (Expected 700). Ignoring on Windows."
             test_pass
        else
             test_fail "Expected permissions 700, got $perms"
        fi
    fi
}

# Run Tests
test_cleanup_lifo
test_idempotency
test_idempotency_failure
test_idempotency_args
test_idempotency_empty_key
test_trap_err
# Skip INT/TERM tests on Windows if they are unreliable in this environment
# or make them warn-only if we suspect environmental issues with 'kill' and 'trap' in Git Bash
if [[ "${OSTYPE:-}" == "msys" || "${OSTYPE:-}" == "cygwin" || "${OS:-}" == "Windows_NT" ]]; then
    echo "⚠ WARN: Skipping signal tests on Windows (unreliable in CI/GitBash environment)."
else
    test_trap_int
    test_trap_term
fi
test_dir_perms

# Summary
echo ""
echo "========================================================================"
echo "Test Summary"
echo "========================================================================"
echo "Total tests run:    $TESTS_RUN"
echo "Tests passed:       $TESTS_PASSED"
echo "Tests failed:       $TESTS_FAILED"

if [ $TESTS_FAILED -eq 0 ]; then
    exit 0
else
    exit 1
fi
