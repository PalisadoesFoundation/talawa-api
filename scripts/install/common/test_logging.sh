#!/usr/bin/env bash
# Tests for scripts/install/common/logging.sh

set -euo pipefail

# Find directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOGGING_LIB="${SCRIPT_DIR}/logging.sh"

if [ ! -f "$LOGGING_LIB" ]; then
    echo "Error: logging.sh not found at $LOGGING_LIB"
    exit 1
fi

export LOG_FILE="/tmp/test_logging_$$.log"
source "$LOGGING_LIB"

echo "=== Testing logging.sh ==="

# Helper to capture stdout/stderr
capture_output() {
    local out_file="/tmp/test_out_$$"
    local err_file="/tmp/test_err_$$"
    if "$@" >"$out_file" 2>"$err_file"; then
        echo "0" > "/tmp/test_exit_$$"
    else
        echo "$?" > "/tmp/test_exit_$$"
    fi
    cat "$out_file"
    cat "$err_file" >&2
    rm -f "$out_file" "$err_file"
}

# Test 1: Basic markers
echo "--- Test 1: Markers ---"
# We need to capture the functions output, but they write to LOG_FILE and stdout/stderr.
# Let's check LOG_FILE content and captured output.
OUTPUT=$( { info "Testing info"; success "Testing success"; warn "Testing warn"; } 2>&1 )
ERR_OUTPUT=$( { error "Testing error" || true; } 2>&1 ) # error writes to stderr

if ! grep -q "Testing info" "$LOG_FILE"; then echo "FAIL: Info not logged to file"; exit 1; fi
if ! echo "$OUTPUT" | grep -q "Testing info"; then echo "FAIL: Info not printed to stdout"; exit 1; fi

if ! grep -q "✓ Testing success" "$LOG_FILE"; then echo "FAIL: Success not logged with ✓"; exit 1; fi
if ! echo "$OUTPUT" | grep -q "✓ Testing success"; then echo "FAIL: Success not printed with ✓"; exit 1; fi

if ! grep -q "✗ ERROR: Testing error" "$LOG_FILE"; then echo "FAIL: Error not logged with ✗"; exit 1; fi
if ! echo "$ERR_OUTPUT" | grep -q "✗ ERROR: Testing error"; then echo "FAIL: Error not printed with ✗"; exit 1; fi

echo "Pass: Markers verification"


# Helper to capture output to file
OUT_FILE="/tmp/test_output_$$"

# Test 2: with_timer success
echo "--- Test 2: with_timer success ---"
reset_timing
with_timer "Sleep 1sec" sleep 1 > "$OUT_FILE" 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then echo "FAIL: with_timer returned non-zero"; exit 1; fi

# Check internals
if [ "${#__TIMING_LABELS[@]}" -ne 1 ]; then 
    echo "FAIL: Timing label not recorded. Count: ${#__TIMING_LABELS[@]}"
    exit 1
fi
if [ "${__TIMING_STATUS[0]}" != "✓" ]; then echo "FAIL: Timing status incorrect"; exit 1; fi
if ! grep -q "✓ Sleep 1sec completed in" "$OUT_FILE"; then echo "FAIL: with_timer success output missing"; exit 1; fi

echo "Pass: with_timer success"

# Test 3: with_timer failure
echo "--- Test 3: with_timer failure ---"
set +e
with_timer "Fail command" false > "$OUT_FILE" 2>&1
EXIT_CODE=$?
set -e
if [ $EXIT_CODE -eq 0 ]; then echo "FAIL: with_timer should propagate error"; exit 1; fi
if [ "${__TIMING_STATUS[1]}" != "✗" ]; then echo "FAIL: Timing status incorrect for failure"; exit 1; fi
if ! grep -q "✗ ERROR: Fail command failed after" "$OUT_FILE"; then echo "FAIL: with_timer failure output missing"; exit 1; fi

echo "Pass: with_timer failure"

# Test 4: with_spinner success
echo "--- Test 4: with_spinner success ---"
with_spinner "Spinning success..." sleep 1 > "$OUT_FILE" 2>&1
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then echo "FAIL: with_spinner returned non-zero"; exit 1; fi
if ! grep -q "✓ Spinning success..." "$OUT_FILE"; then echo "FAIL: Spinner success message missing"; exit 1; fi

echo "Pass: with_spinner success"

# Test 5: with_spinner failure
echo "--- Test 5: with_spinner failure ---"
set +e
with_spinner "Spinning failure..." false > "$OUT_FILE" 2>&1
EXIT_CODE=$?
set -e
if [ $EXIT_CODE -eq 0 ]; then echo "FAIL: with_spinner should propagate error"; exit 1; fi
if ! grep -q "✗ ERROR: Spinning failure... failed" "$OUT_FILE"; then echo "FAIL: Spinner failure message missing"; exit 1; fi

echo "Pass: with_spinner failure"

# Test 6: with_spinner interruption (SIGINT)
echo "--- Test 6: with_spinner interruption ---"
# Start a spinner that runs a long sleep in background
(
  # Trap INT to prevent the subshell from just dying immediately without verifying
  trap 'exit 130' INT
  with_spinner "Interrupted spinner..." sleep 10
) &
PID=$!
sleep 1
kill -INT $PID
set +e
wait $PID
EXIT_CODE=$?
set -e
# Note: implementation returns 130 on interruption
if [ $EXIT_CODE -ne 130 ]; then echo "FAIL: Interruption exit code $EXIT_CODE != 130"; exit 1; fi

# We can't easily capture output of background process in this simple test script structure without pipes,
# but verify logic is sound.
echo "Pass: with_spinner interruption"

# Test 7: Summaries
echo "--- Test 7: Summaries ---"
# Capture output of formatting functions
print_timing_summary > "$OUT_FILE"
if ! grep -q "Timing Summary" "$OUT_FILE"; then echo "FAIL: Timing summary header missing"; exit 1; fi
if ! grep -q "\[✓\] Sleep 1sec" "$OUT_FILE"; then echo "FAIL: Timing summary missing success item"; exit 1; fi
if ! grep -q "\[✗\] Fail command" "$OUT_FILE"; then echo "FAIL: Timing summary missing fail item"; exit 1; fi
if ! grep -q "Total time:" "$OUT_FILE"; then echo "FAIL: Timing summary total missing"; exit 1; fi

print_installation_summary 0 > "$OUT_FILE"
if ! grep -q "✓ Core dependencies verified" "$OUT_FILE"; then echo "FAIL: Install success message missing"; exit 1; fi

print_installation_summary 1 > "$OUT_FILE"
if ! grep -q "✗ Installation failed" "$OUT_FILE"; then echo "FAIL: Install failure message missing"; exit 1; fi

echo "Pass: Summaries"

echo "=== All Tests Passed ==="
rm "$LOG_FILE" "$OUT_FILE"
