#!/usr/bin/env bash
# Test script for progress indicators and timing functionality

set -euo pipefail

# Source the logging library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/logging.sh"

print_banner "Testing Progress Indicators"

# Test 1: with_timer
print_section "Test 1: with_timer"
info "Running a 2-second task with timing..."
with_timer "Quick task" sleep 2

info "Running a 3-second task with timing..."
with_timer "Medium task" sleep 3

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
info "Running a 2-second task with spinner..."
with_spinner "Processing data" sleep 2

info "Running a 3-second task with spinner..."
with_spinner "Installing packages" sleep 3

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
with_timer "Complex operation" with_spinner "Working" sleep 2

# Test 4: Timing summary
print_timing_summary

# Test 5: Installation summary (success case)
print_section "Test 5: Installation summary (success)"
print_installation_summary 0

# Test 5b: Installation summary (failure case)
print_section "Test 5b: Installation summary (failure)"
print_installation_summary 1

print_log_location

info "All tests completed!"
