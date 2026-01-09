#!/bin/bash

# Script to run all test shards and collect results
# Enable safer bash options for better error handling
set -euo pipefail

# Preflight checks: ensure required CLIs are available
if ! command -v docker >/dev/null 2>&1; then
	echo "Error: docker is not installed or not in PATH" >&2
	exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
	echo "Error: jq is not installed or not in PATH" >&2
	exit 1
fi

# Make shard count configurable (default to 12)
SHARD_COUNT="${SHARD_COUNT:-12}"

echo "=========================================="
echo "Running All $SHARD_COUNT Test Shards"
echo "=========================================="
echo ""

TOTAL_PASSED=0
TOTAL_FAILED=0
TOTAL_FILES_PASSED=0
TOTAL_FILES_FAILED=0

# Use seq for portability (works on macOS and Linux)
for i in $(seq 1 "$SHARD_COUNT"); do
  echo "=== Running Shard $i/$SHARD_COUNT ==="
  
  # Create temporary file for shard output (streamed to disk to avoid memory issues)
  # Use TMPDIR if set, otherwise fall back to /tmp (works on macOS, Linux, and most Unix systems)
  TMP_DIR="${TMPDIR:-/tmp}"
  # Export TMPDIR so mktemp -t works across platforms
  export TMPDIR="$TMP_DIR"
  SHARD_OUTPUT_FILE=$(mktemp -t "shard-XXXXXX") || {
    echo "Error: Failed to create temporary file" >&2
    exit 1
  }
  # Use workspace-based path (accessible outside containers) to match run-shard.js
  WORKSPACE_DIR="${GITHUB_WORKSPACE:-$(pwd)}"
  JSON_OUTPUT_FILE="${WORKSPACE_DIR}/.test-results/shard-${i}-results.json"
  
  # Temporarily disable errexit to capture output and status even on failure
  set +e
  # Run shard and stream output to temp file while also showing it live
  docker compose run --rm -e "SHARD_INDEX=$i" -e "SHARD_COUNT=$SHARD_COUNT" api pnpm test:shard:coverage 2>&1 | tee "$SHARD_OUTPUT_FILE"
  SHARD_STATUS=${PIPESTATUS[0]}
  # Restore errexit
  set -e
  
  # Fail-fast if shard execution failed
  if [ "$SHARD_STATUS" -ne 0 ]; then
    echo "Shard $i failed with exit code $SHARD_STATUS"
    cat "$SHARD_OUTPUT_FILE"
    rm -f "$SHARD_OUTPUT_FILE"
    exit "$SHARD_STATUS"
  fi
  
  # Load JSON directly from the deterministic output file
  # Fallback to empty object if file is missing or invalid
  if [ -f "$JSON_OUTPUT_FILE" ] && jq -e '.numPassedTests >= 0' "$JSON_OUTPUT_FILE" >/dev/null 2>&1; then
    JSON_OUTPUT=$(cat "$JSON_OUTPUT_FILE")
  else
    JSON_OUTPUT="{}"
  fi
  
  # Parse JSON summary with jq, defaulting to 0 if fields are missing or JSON is invalid
  # Use jq with fallback to 0, then sanitize to ensure numeric values
  TESTS_PASSED_RAW=$(echo "$JSON_OUTPUT" | jq -r '.numPassedTests // 0' 2>/dev/null || echo "0")
  TESTS_FAILED_RAW=$(echo "$JSON_OUTPUT" | jq -r '.numFailedTests // 0' 2>/dev/null || echo "0")
  FILES_PASSED_RAW=$(echo "$JSON_OUTPUT" | jq -r '.numPassedTestSuites // 0' 2>/dev/null || echo "0")
  FILES_FAILED_RAW=$(echo "$JSON_OUTPUT" | jq -r '.numFailedTestSuites // 0' 2>/dev/null || echo "0")
  
  # Normalize to safe integers: strip non-digits, default to 0 if empty/invalid
  # Extract only digits, then use arithmetic expansion to coerce to integer (safer than printf)
  TESTS_PASSED_SANITIZED=$(echo "${TESTS_PASSED_RAW}" | tr -cd '0-9' || echo "0")
  TESTS_FAILED_SANITIZED=$(echo "${TESTS_FAILED_RAW}" | tr -cd '0-9' || echo "0")
  FILES_PASSED_SANITIZED=$(echo "${FILES_PASSED_RAW}" | tr -cd '0-9' || echo "0")
  FILES_FAILED_SANITIZED=$(echo "${FILES_FAILED_RAW}" | tr -cd '0-9' || echo "0")
  
  # Ensure sanitized values are non-empty (final safety check before arithmetic)
  TESTS_PASSED_SANITIZED=${TESTS_PASSED_SANITIZED:-0}
  TESTS_FAILED_SANITIZED=${TESTS_FAILED_SANITIZED:-0}
  FILES_PASSED_SANITIZED=${FILES_PASSED_SANITIZED:-0}
  FILES_FAILED_SANITIZED=${FILES_FAILED_SANITIZED:-0}
  
  # Coerce to integer using arithmetic expansion (safe now that values are guaranteed non-empty)
  TESTS_PASSED=$((TESTS_PASSED_SANITIZED + 0))
  TESTS_FAILED=$((TESTS_FAILED_SANITIZED + 0))
  FILES_PASSED=$((FILES_PASSED_SANITIZED + 0))
  FILES_FAILED=$((FILES_FAILED_SANITIZED + 0))
  
  # Check if graphql.test.ts ran in this shard (non-fatal grep)
  if grep -q "graphql.test" "$SHARD_OUTPUT_FILE" 2>/dev/null || true; then
    echo "  ✓ graphql.test.ts found in this shard!"
    grep -A 10 "graphql.test" "$SHARD_OUTPUT_FILE" 2>/dev/null || true
  fi
  
  echo "  Results: $TESTS_PASSED passed, $TESTS_FAILED failed"
  echo "  Files: $FILES_PASSED passed, $FILES_FAILED failed"
  echo ""
  
  TOTAL_PASSED=$((TOTAL_PASSED + TESTS_PASSED))
  TOTAL_FAILED=$((TOTAL_FAILED + TESTS_FAILED))
  TOTAL_FILES_PASSED=$((TOTAL_FILES_PASSED + FILES_PASSED))
  TOTAL_FILES_FAILED=$((TOTAL_FILES_FAILED + FILES_FAILED))
  
  # Clean up temp files for this shard
  rm -f "$SHARD_OUTPUT_FILE"
  # Note: JSON_OUTPUT_FILE is kept for potential debugging but could be cleaned up here if desired
  # rm -f "$JSON_OUTPUT_FILE"
done

echo "=========================================="
echo "SUMMARY - All Shards Complete"
echo "=========================================="
echo "Total Tests: $TOTAL_PASSED passed, $TOTAL_FAILED failed"
echo "Total Files: $TOTAL_FILES_PASSED passed, $TOTAL_FILES_FAILED failed"
echo "=========================================="
