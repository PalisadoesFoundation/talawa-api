#!/usr/bin/env bash
# Test script for progress indicators and timing functionality

set -euo pipefail

# Source the logging library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/logging.sh"

print_banner "Testing Progress Indicators"

# Configurable sleep durations for faster tests
SLEEP_SHORT="${TEST_SLEEP_SHORT:-1}"
SLEEP_LONG="${TEST_SLEEP_LONG:-2}"

# Test 0: Timing summary with no data
print_section "Test 0: Timing summary (no data)"
info "Verifying timing summary when no data is recorded..."
empty_output=$(print_timing_summary 2>&1)
if ! echo "$empty_output" | grep -q 'No timing data recorded.'; then
  error "Timing summary should report no data recorded"
  exit 1
fi
success "Empty timing summary output verification passed"

# Test 1: with_timer
print_section "Test 1: with_timer"
info "Running a ${SLEEP_SHORT}-second task with timing..."
with_timer "Quick task" sleep "$SLEEP_SHORT"

info "Running a ${SLEEP_LONG}-second task with timing..."
with_timer "Medium task" sleep "$SLEEP_LONG"

# Test 1b: with_timer failure path
print_section "Test 1b: with_timer failure"
info "Running a failing task with timing..."
if with_timer "Failing task" bash -c 'exit 2'; then
  error "Expected with_timer to fail"
  exit 1
fi
info "Failure test passed - exit code properly captured"

# Test 2: with_spinner
print_section "Test 2: with_spinner"
info "Running a ${SLEEP_SHORT}-second task with spinner..."
with_spinner "Processing data" sleep "$SLEEP_SHORT"

info "Running a ${SLEEP_LONG}-second task with spinner..."
with_spinner "Installing packages" sleep "$SLEEP_LONG"

# Test 2b: with_spinner failure path
print_section "Test 2b: with_spinner failure"
info "Running a failing task with spinner..."
if with_spinner "Failing spinner task" bash -c 'exit 3'; then
  error "Expected with_spinner to fail"
  exit 1
fi
info "Failure test passed - exit code properly captured"

# Test 3: Combined with_timer and with_spinner
print_section "Test 3: Combined timing and spinner"
info "Running a task with both timer and spinner..."
with_timer "Complex operation" with_spinner "Working" sleep "$SLEEP_SHORT"

# Test 4: Timing summary with output verification
print_section "Test 4: Timing summary"
info "Verifying timing summary output..."

# Capture timing summary output
output=$(print_timing_summary 2>&1)

# Verify the output contains expected entries
if ! echo "$output" | grep -q '\[FAIL\] Failing task'; then
  error "Timing summary missing failure entry for 'Failing task'"
  exit 1
fi

if ! echo "$output" | grep -q '\[OK\] Quick task'; then
  error "Timing summary missing success entry for 'Quick task'"
  exit 1
fi

if ! echo "$output" | grep -q '\[OK\] Complex operation'; then
  error "Timing summary missing success entry for 'Complex operation'"
  exit 1
fi

if ! echo "$output" | grep -q 'Total time:'; then
  error "Timing summary missing total time"
  exit 1
fi

success "Timing summary output verification passed"

# Test 5: Installation summary (success case)
print_section "Test 5: Installation summary (success)"
install_success_output=$(print_installation_summary 0 2>&1)
if ! echo "$install_success_output" | grep -q '\[OK\] Installation completed successfully'; then
  error "Installation summary missing success status"
  exit 1
fi
if ! echo "$install_success_output" | grep -q 'See log:'; then
  error "Installation summary missing log location"
  exit 1
fi
success "Installation success summary verified"

# Test 5b: Installation summary (failure case)
print_section "Test 5b: Installation summary (failure)"
install_fail_output=$(print_installation_summary 1 2>&1)
if ! echo "$install_fail_output" | grep -q '\[x\] Installation failed'; then
  error "Installation summary missing failure status"
  exit 1
fi
success "Installation failure summary verified"

print_log_location

info "All tests completed!"
