#!/bin/bash

################################################################################
# run-all-shards.sh - Orchestrate test shards and collect JSON results
#
# Purpose:
#   Runs all test shards in sequence using docker compose, collects JSON result
#   files from each shard container, and aggregates test statistics. The script
#   uses docker compose to run the 'api' container which invokes run-shard.js
#   to execute Vitest with sharding enabled.
#
# Usage:
#   ./run-all-shards.sh
#   SHARD_COUNT=8 ./run-all-shards.sh
#   GITHUB_WORKSPACE=/custom/path ./run-all-shards.sh
#
# Environment Variables:
#   SHARD_COUNT       - Number of test shards to run (default: 12, must be positive integer)
#   GITHUB_WORKSPACE  - Workspace directory path (default: current working directory)
#   CONTAINER_WORKDIR - Container working directory (default: /home/talawa/api)
#
# External Dependencies:
#   - docker: Required for container management
#   - docker compose: Required to run test containers
#   - jq: Required for parsing JSON result files
#
# Runtime Behavior:
#   - Uses docker compose to run 'api' container which invokes run-shard.js
#   - Each shard writes JSON results to .test-results/shard-<n>-results.json inside container
#   - Results are copied from container to host via docker cp
#   - Script temporarily disables errexit (set +e) around docker compose run to capture
#     exit codes even when shards fail, allowing collection of results from all shards
#
# Exit Codes:
#   0 - All shards completed successfully and all tests passed
#   1 - One or more shards failed to execute OR tests failed (TOTAL_FAILED > 0 OR TOTAL_FILES_FAILED > 0)
#
# Configurable Defaults:
#   - SHARD_COUNT defaults to 12 if not set
#   - GITHUB_WORKSPACE defaults to current working directory if not set
#   - CONTAINER_WORKDIR defaults to /home/talawa/api if not set
################################################################################

# Enable safer bash options for better error handling
# Note: We use set +e around docker commands to handle failures gracefully
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
# Validate SHARD_COUNT is a positive integer - fail fast on invalid input
if ! [[ "$SHARD_COUNT" =~ ^[1-9][0-9]*$ ]]; then
	echo "Error: SHARD_COUNT must be a positive integer (>= 1), got: $SHARD_COUNT" >&2
	exit 1
fi

echo "=========================================="
echo "Running All $SHARD_COUNT Test Shards"
echo "=========================================="
echo ""

TOTAL_PASSED=0
TOTAL_FAILED=0
TOTAL_FILES_PASSED=0
TOTAL_FILES_FAILED=0
SHARD_ANY_FAILED=0

# Configurable container working directory (default matches Docker image)
CONTAINER_WORKDIR="${CONTAINER_WORKDIR:-/home/talawa/api}"

# Use workspace-based path for deterministic JSON file locations
# Export GITHUB_WORKSPACE to container so run-shard.js uses the same path
WORKSPACE_DIR="${GITHUB_WORKSPACE:-$(pwd)}"

# Use seq for portability (works on macOS and Linux)
for i in $(seq 1 "$SHARD_COUNT"); do
  echo "=== Running Shard $i/$SHARD_COUNT ==="
  
  # Deterministic JSON output file path (unique per shard to avoid collisions)
  # Use workspace-based path derived from GITHUB_WORKSPACE
  JSON_OUTPUT_FILE="${WORKSPACE_DIR}/.test-results/shard-${i}-results.json"
  
  # Remove stale host JSON file before running/copying to avoid parsing old results
  rm -f "$JSON_OUTPUT_FILE"
  
  # Clean up any existing container with this name before starting
  CONTAINER_NAME="talawa-api-test-shard-${i}"
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
  
  # Temporarily disable errexit to capture status even on failure
  set +e
  # Run shard (JSON output is written to file by run-shard.js inside container)
  # Use --name (without --rm) to allow copying files out after container stops
  # Export GITHUB_WORKSPACE to container so run-shard.js uses CONTAINER_WORKDIR as workspace
  docker compose run --name "$CONTAINER_NAME" \
    -e "SHARD_INDEX=$i" \
    -e "SHARD_COUNT=$SHARD_COUNT" \
    -e "GITHUB_WORKSPACE=$CONTAINER_WORKDIR" \
    api pnpm test:shard:coverage
  SHARD_STATUS=$?
  # Restore errexit
  set -e
  
  # Track if any shard failed
  if [ "$SHARD_STATUS" -ne 0 ]; then
    echo "Shard $i failed with exit code $SHARD_STATUS" >&2
    SHARD_ANY_FAILED=1
  fi
  
  # Copy JSON file from container to host (workspace may not be mounted in testing compose)
  # Wait for JSON file to be fully written using polling loop
  # JSON file path in container matches run-shard.js output (uses GITHUB_WORKSPACE which we set to CONTAINER_WORKDIR)
  CONTAINER_JSON="${CONTAINER_WORKDIR}/.test-results/shard-${i}-results.json"
  mkdir -p "$(dirname "$JSON_OUTPUT_FILE")"
  
  # Poll for JSON file existence and size stability (wait for file to be fully written)
  POLL_TIMEOUT=60  # Maximum iterations to wait (60 * 0.5s = 30 seconds max)
  POLL_INTERVAL=0.5  # Check every 0.5 seconds
  STABLE_ITERATIONS=2  # File size must be unchanged for 2 consecutive checks
  ITERATION=0
  PREV_SIZE=-1
  STABLE_COUNT=0
  
  while [ $ITERATION -lt $POLL_TIMEOUT ]; do
    # Check if container is still running
    CONTAINER_RUNNING=$(docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$" && echo "true" || echo "false")
    
    # Check if file exists and get its size
    # Use docker exec if container is running, otherwise container has stopped and file should be ready
    if [ "$CONTAINER_RUNNING" = "true" ]; then
      FILE_SIZE=$(docker exec "$CONTAINER_NAME" sh -c "test -f '$CONTAINER_JSON' && stat -c%s '$CONTAINER_JSON' 2>/dev/null || echo '0'" 2>/dev/null || echo "0")
    else
      # Container stopped - file should be written by now, break polling and proceed to copy
      break
    fi
    
    if [ "$FILE_SIZE" != "0" ] && [ "$FILE_SIZE" != "" ]; then
      if [ "$FILE_SIZE" = "$PREV_SIZE" ]; then
        STABLE_COUNT=$((STABLE_COUNT + 1))
        if [ $STABLE_COUNT -ge $STABLE_ITERATIONS ]; then
          # File size is stable, proceed with copy
          break
        fi
      else
        # Size changed, reset stable count
        STABLE_COUNT=0
        PREV_SIZE="$FILE_SIZE"
      fi
    fi
    
    sleep "$POLL_INTERVAL"
    ITERATION=$((ITERATION + 1))
  done
  
  # Fallback to fixed sleep if polling timeout reached
  if [ $ITERATION -ge $POLL_TIMEOUT ]; then
    echo "  Warning: Polling timeout reached, using fallback sleep" >&2
    sleep 2
  fi
  
  # Attempt single docker cp before removing container (suppress errors to allow continuation)
  if docker cp "${CONTAINER_NAME}:${CONTAINER_JSON}" "$JSON_OUTPUT_FILE" 2>/dev/null; then
    echo "  Copied JSON results from container"
  else
    echo "  Warning: Could not copy JSON file from container" >&2
    # Inspect container state and logs for debugging (docker exec doesn't work on stopped containers)
    if docker ps -a --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
      echo "  Container state:" >&2
      docker inspect "$CONTAINER_NAME" --format "  Status: {{.State.Status}}, ExitCode: {{.State.ExitCode}}" 2>/dev/null || true
      echo "  Last 10 log lines:" >&2
      docker logs --tail 10 "$CONTAINER_NAME" 2>/dev/null || true
      echo "  Expected file path: $CONTAINER_JSON" >&2
    fi
  fi
  # Remove container only once after copy attempt
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

# Exit with failure if any shard execution failed or any tests failed
if [ "$SHARD_ANY_FAILED" -ne 0 ] || [ "$TOTAL_FAILED" -gt 0 ] || [ "$TOTAL_FILES_FAILED" -gt 0 ]; then
  exit 1
fi
exit 0
