#!/bin/bash

##############################################################################
# logging.test.sh - Talawa API Logging Library Test Suite
#
# Validates spinner, timer, and summary behavior by wrapping slow commands.
#
# Usage: ./logging.test.sh
# Returns: 0 if all tests pass, 1 if any test fails
# Requirements: bash 3.2+
##############################################################################

set -e

# Test statistics
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Use a dedicated test log file so we don't pollute the default log
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
SCRIPTS_INSTALL="$REPO_ROOT/scripts/install"
LOG_FILE="/tmp/talawa-logging-test-$$.log"
trap 'rm -f "$LOG_FILE"' EXIT
export LOG_FILE

# Configurable timer/spinner duration; extend in CI to reduce flakiness
if [ -n "${CI:-}" ]; then
  TEST_TIMER_DURATION_SEC="${TEST_TIMER_DURATION_SEC:-2}"
else
  TEST_TIMER_DURATION_SEC="${TEST_TIMER_DURATION_SEC:-1}"
fi

# Source the logging library (creates LOG_FILE and __TIMINGS)
source "$SCRIPTS_INSTALL/common/logging.sh"

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
# Test: with_timer records step and completes in expected duration
##############################################################################

test_start "with_timer records step and completes in ~${TEST_TIMER_DURATION_SEC}s"
if with_timer "test-step" sleep "$TEST_TIMER_DURATION_SEC"; then
  # __TIMINGS is array of "label:seconds"; find test-step
  found_sec=""
  for entry in "${__TIMINGS[@]}"; do
    if [[ "$entry" == test-step:* ]]; then
      found_sec="${entry#*:}"
      break
    fi
  done
  if [ -n "$found_sec" ] && [ "$found_sec" -ge "$TEST_TIMER_DURATION_SEC" ]; then
    test_pass
  else
    test_fail "Expected test-step in __TIMINGS with >= ${TEST_TIMER_DURATION_SEC}s, got: ${found_sec:-none}"
  fi
else
  test_fail "with_timer should have exited 0 for sleep $TEST_TIMER_DURATION_SEC"
fi

##############################################################################
# Test: with_timer returns non-zero when command fails
##############################################################################

test_start "with_timer returns non-zero when command fails"
set +e
with_timer "fail-step" false
exitcode=$?
set -e
if [ "$exitcode" -ne 0 ]; then
  test_pass
else
  test_fail "Expected non-zero exit from with_timer false, got $exitcode"
fi

##############################################################################
# Test: with_spinner runs command and shows spinner
##############################################################################

test_start "with_spinner runs command and shows spinner"
if with_spinner "Waiting" sleep "$TEST_TIMER_DURATION_SEC"; then
  test_pass
else
  test_fail "with_spinner sleep $TEST_TIMER_DURATION_SEC should complete with exit 0"
fi

##############################################################################
# Test: with_spinner propagates non-zero exit code
##############################################################################

test_start "with_spinner propagates non-zero exit code"
set +e
with_spinner "Failing" false
exitcode=$?
set -e
if [ "$exitcode" -ne 0 ]; then
  test_pass
else
  test_fail "Expected non-zero exit from with_spinner false, got $exitcode"
fi

##############################################################################
# Test: with_timer with no command returns error and non-zero
##############################################################################

test_start "with_timer with no command returns error and non-zero"
set +e
err=$(with_timer "only" 2>&1)
exitcode=$?
set -e
if [ "$exitcode" -ne 0 ] && echo "$err" | grep -q "with_timer: no command given"; then
  test_pass
else
  test_fail "Expected exit 1 and 'no command given'; exitcode=$exitcode, err=$err"
fi

##############################################################################
# Test: with_spinner with no command returns error and non-zero
##############################################################################

test_start "with_spinner with no command returns error and non-zero"
set +e
err=$(with_spinner "msg" 2>&1)
exitcode=$?
set -e
if [ "$exitcode" -ne 0 ] && echo "$err" | grep -q "with_spinner: no command given"; then
  test_pass
else
  test_fail "Expected exit 1 and 'no command given'; exitcode=$exitcode, err=$err"
fi

##############################################################################
# Test: warn (stderr) writes to stderr and appends to LOG_FILE
##############################################################################

test_start "warn writes to stderr and appends to log file"
set +e
unique_msg="logging-test-warn-$$"
stderr_capture=$(warn "$unique_msg" 2>&1)
set -e
if echo "$stderr_capture" | grep -q "WARNING:.*$unique_msg" && grep -q "WARNING:.*$unique_msg" "$LOG_FILE"; then
  test_pass
else
  test_fail "Expected '$unique_msg' on stderr and in $LOG_FILE. stderr=$stderr_capture"
fi

##############################################################################
# Test: print_timing_summary parses labels containing colons
##############################################################################

test_start "print_timing_summary parses labels containing colons"
with_timer "step:with:colons" true 2>/dev/null || true
summary=$(print_timing_summary 2>&1)
if echo "$summary" | grep -q "step:with:colons" && echo "$summary" | grep -qE '✓ step:with:colons: [0-9]+s'; then
  test_pass
else
  test_fail "Summary should contain 'step:with:colons' and time. Got: $summary"
fi

##############################################################################
# Test: print_timing_summary includes recorded steps
##############################################################################

test_start "print_timing_summary includes recorded steps"
# Ensure we have at least one step (from earlier with_timer calls)
with_timer "step1" true 2>/dev/null || true
summary=$(print_timing_summary 2>&1)
if echo "$summary" | grep -q "Timing Summary" && echo "$summary" | grep -q "step1" && echo "$summary" | grep -qE '[0-9]+s'; then
  test_pass
else
  test_fail "Summary should contain 'Timing Summary', 'step1', and time. Got: $summary"
fi

##############################################################################
# Test: print_installation_summary prints header and log path
##############################################################################

test_start "print_installation_summary prints header and log path"
summary=$(print_installation_summary 2>&1)
if echo "$summary" | grep -q "Installation Summary" && echo "$summary" | grep -q "Core dependencies verified" && echo "$summary" | grep -q "See log:"; then
  test_pass
else
  test_fail "Summary should contain 'Installation Summary', 'Core dependencies verified', 'See log:'. Got: $summary"
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
  echo "✓ All tests passed!"
  echo ""
  exit 0
else
  echo "✗ Some tests failed"
  echo ""
  exit 1
fi
