#!/bin/bash

# Script to run all test shards and collect results
# Enable safer bash options for better error handling
# Note: We use set +e around docker commands to handle failures gracefully
set -uo pipefail

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
  
  # Deterministic JSON output file path (unique per shard to avoid collisions)
  # Use workspace-based path (accessible from host via bind mount)
  WORKSPACE_DIR="${GITHUB_WORKSPACE:-$(pwd)}"
  JSON_OUTPUT_FILE="${WORKSPACE_DIR}/.test-results/shard-${i}-results.json"
  
  # Clean up any existing container with this name before starting
  CONTAINER_NAME="talawa-api-test-shard-${i}"
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
  
  # Temporarily disable errexit to capture status even on failure
  set +e
  # Run shard (JSON output is written to file by run-shard.js inside container)
  # Use --name (without --rm) to allow copying files out after container stops
  docker compose run --name "$CONTAINER_NAME" -e "SHARD_INDEX=$i" -e "SHARD_COUNT=$SHARD_COUNT" api pnpm test:shard:coverage
  SHARD_STATUS=$?
  # Restore errexit
  set -e
  
  # Fail-fast if shard execution failed
  if [ "$SHARD_STATUS" -ne 0 ]; then
    echo "Shard $i failed with exit code $SHARD_STATUS" >&2
    # Still try to copy JSON file even on failure for debugging
    CONTAINER_JSON="/home/talawa/api/.test-results/shard-${i}-results.json"
    mkdir -p "$(dirname "$JSON_OUTPUT_FILE")"
    docker cp "${CONTAINER_NAME}:${CONTAINER_JSON}" "$JSON_OUTPUT_FILE" 2>/dev/null || true
    docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
    exit "$SHARD_STATUS"
  fi
  
  # Copy JSON file from container to host (workspace may not be mounted in testing compose)
  # Wait a moment for file to be fully written
  sleep 2
  CONTAINER_JSON="/home/talawa/api/.test-results/shard-${i}-results.json"
  mkdir -p "$(dirname "$JSON_OUTPUT_FILE")"
  if docker cp "${CONTAINER_NAME}:${CONTAINER_JSON}" "$JSON_OUTPUT_FILE" 2>/dev/null; then
    echo "  Copied JSON results from container"
  else
    echo "  Warning: Could not copy JSON file from container" >&2
    # Try to check if container still exists and file is there
    if docker ps -a --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
      docker exec "$CONTAINER_NAME" ls -la "$CONTAINER_JSON" 2>/dev/null || echo "  File does not exist in container" >&2
    fi
  fi
  # Clean up container (remove --rm since we used --name)
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
  
  # Load JSON directly from the deterministic output file
  # Fallback to 0 if file is missing or invalid (don't mask errors, but allow continuation)
  if [ -f "$JSON_OUTPUT_FILE" ] && jq -e '.numPassedTests >= 0' "$JSON_OUTPUT_FILE" >/dev/null 2>&1; then
    # Parse JSON summary with jq, defaulting to 0 if fields are missing
    TESTS_PASSED=$(jq -r '.numPassedTests // 0' "$JSON_OUTPUT_FILE" 2>/dev/null || echo "0")
    TESTS_FAILED=$(jq -r '.numFailedTests // 0' "$JSON_OUTPUT_FILE" 2>/dev/null || echo "0")
    FILES_PASSED=$(jq -r '.numPassedTestSuites // 0' "$JSON_OUTPUT_FILE" 2>/dev/null || echo "0")
    FILES_FAILED=$(jq -r '.numFailedTestSuites // 0' "$JSON_OUTPUT_FILE" 2>/dev/null || echo "0")
  else
    # File missing or invalid - log warning but don't fail (allows debugging)
    echo "  Warning: JSON output file not found or invalid: $JSON_OUTPUT_FILE" >&2
    TESTS_PASSED=0
    TESTS_FAILED=0
    FILES_PASSED=0
    FILES_FAILED=0
  fi
  
  echo "  Results: $TESTS_PASSED passed, $TESTS_FAILED failed"
  echo "  Files: $FILES_PASSED passed, $FILES_FAILED failed"
  echo ""
  
  TOTAL_PASSED=$((TOTAL_PASSED + TESTS_PASSED))
  TOTAL_FAILED=$((TOTAL_FAILED + TESTS_FAILED))
  TOTAL_FILES_PASSED=$((TOTAL_FILES_PASSED + FILES_PASSED))
  TOTAL_FILES_FAILED=$((TOTAL_FILES_FAILED + FILES_FAILED))
  
  # Cleanup temporary JSON file (optional, can be kept for debugging)
  # rm -f "$JSON_OUTPUT_FILE"
done

echo "=========================================="
echo "SUMMARY - All Shards Complete"
echo "=========================================="
echo "Total Tests: $TOTAL_PASSED passed, $TOTAL_FAILED failed"
echo "Total Files: $TOTAL_FILES_PASSED passed, $TOTAL_FILES_FAILED failed"
echo "=========================================="
