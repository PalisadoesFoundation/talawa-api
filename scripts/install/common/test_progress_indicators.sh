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
reset_timing # Ensure clean state
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

# Test 1c: with_timer input validation
print_section "Test 1c: with_timer input validation"
if with_timer "Label only, no command" 2>/dev/null; then
  error "Expected with_timer to fail with missing arguments"
  exit 1
fi
if with_timer 2>/dev/null; then
  error "Expected with_timer to fail with no arguments"
  exit 1
fi
if with_timer "" sleep 1 2>/dev/null; then
  error "Expected with_timer to fail with empty label"
  exit 1
fi
success "Input validation passed"

# Test 2: with_spinner
reset_timing
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

# Test 2c: with_spinner input validation
print_section "Test 2c: with_spinner input validation"
if with_spinner "Message only, no command" 2>/dev/null; then
  error "Expected with_spinner to fail with missing arguments"
  exit 1
fi
if with_spinner 2>/dev/null; then
  error "Expected with_spinner to fail with no arguments"
  exit 1
fi
if with_spinner "" sleep 1 2>/dev/null; then
  error "Expected with_spinner to fail with empty message"
  exit 1
fi
success "Input validation passed"

# Test 2d: with_spinner signal handling (Interrupt)
print_section "Test 2d: with_spinner signal handling"
info "Testing spinner cleanup on SIGINT..."

# Create a temporary script to run the spinner
CAT_SCRIPT="${SCRIPT_DIR}/_temp_spinner_test.sh"
PID_FILE="${SCRIPT_DIR}/_temp_spinner_pid"
# Ensure we clean up the test script and PID file even if we fail early
trap "rm -f '$CAT_SCRIPT' '$PID_FILE'" EXIT INT TERM

cat > "$CAT_SCRIPT" <<EOF
#!/bin/bash
source "${SCRIPT_DIR}/logging.sh"

# We need to capture the PID of the sleep command started by with_spinner
# Usage of explicit bash -c ensures \$\$ expands to the PID of the new shell,
# which exec then replaces with sleep.
export PID_FILE

with_spinner "Spinning indefinitely" bash -c "echo \\$\\$ > '$PID_FILE'; exec sleep 33" &
wait
EOF
chmod +x "$CAT_SCRIPT"

# Run the script in background
"$CAT_SCRIPT" &
SCRIPT_PID=$!
info "Started background script PID: $SCRIPT_PID"

# Wait for it to initialize and write the PID file
count=0
while [ ! -s "$PID_FILE" ]; do
    sleep 0.1
    count=$((count + 1))
    if [ "$count" -gt 50 ]; then
        error "Timeout waiting for PID file"
        rm -f "$CAT_SCRIPT" "$PID_FILE"
        exit 1
    fi
done

SLEEP_PID=$(cat "$PID_FILE")
info "Background sleep process started with PID: $SLEEP_PID"

# Check if sleep is running
if ! kill -0 "$SLEEP_PID" 2>/dev/null; then
   warn "Process $SLEEP_PID not running, test might be flaky"
fi

# Send SIGINT to the script
info "Sending SIGINT to script..."
kill -INT $SCRIPT_PID

# Wait for script to exit
wait $SCRIPT_PID || true

# Verify sleep is gone
sleep 0.5

# Check if sleep is still running
if kill -0 "$SLEEP_PID" 2>/dev/null; then
   error "Background sleep process $SLEEP_PID persists after SIGINT!"
   # Cleanup
   kill "$SLEEP_PID" || true
   rm -f "$CAT_SCRIPT" "$PID_FILE"
   exit 1
fi

rm -f "$CAT_SCRIPT" "$PID_FILE"
# Clear the specific trap for this test section (optional, or just rely on script exit)
trap - EXIT INT TERM
success "Signal handling verification passed: Background process cleaned up."

# Test 3: Combined with_timer and with_spinner
reset_timing
print_section "Test 3: Combined timing and spinner"
info "Running a task with both timer and spinner..."
with_timer "Complex operation" with_spinner "Working" sleep "$SLEEP_SHORT"

# Test 4: Timing summary with output verification
reset_timing
print_section "Test 4: Timing summary"
info "Populating timing data for summary verification..."
with_timer "Quick task" sleep 0.1
with_timer "Complex operation" sleep 0.1
# Failing task failure
if ! with_timer "Failing task" bash -c "exit 1" >/dev/null 2>&1; then
  true # ignore failure
fi

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
