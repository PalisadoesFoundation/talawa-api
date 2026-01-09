#!/bin/bash

# Script to run all 12 test shards and collect results
# Enable safer bash options for better error handling
set -euo pipefail

echo "=========================================="
echo "Running All 12 Test Shards"
echo "=========================================="
echo ""

TOTAL_PASSED=0
TOTAL_FAILED=0
TOTAL_FILES_PASSED=0
TOTAL_FILES_FAILED=0

for i in {1..12}; do
  echo "=== Running Shard $i/12 ==="
  
  # Run shard and capture output
  OUTPUT=$(docker compose run --rm -e "SHARD_INDEX=$i" -e "SHARD_COUNT=12" api pnpm test:shard:coverage 2>&1)
  SHARD_STATUS=$?
  
  # Fail-fast if shard execution failed
  if [ "$SHARD_STATUS" -ne 0 ]; then
    echo "$OUTPUT"
    echo "Shard $i failed with exit code $SHARD_STATUS"
    exit "$SHARD_STATUS"
  fi
  
  # Extract test counts from vitest output
  # Vitest output format examples:
  #   "Test Files   X passed | Y failed | Z total"
  #   "Tests        X passed | Y failed | Z total"
  # Use ^ anchor to match lines starting with "Tests" or "Test Files" for precision
  # Use || true to prevent pipefail from exiting on grep failures (no matches)
  TESTS_PASSED=$(echo "$OUTPUT" | grep -E '^Tests' | grep -oE '[0-9]+ passed' | grep -oE '[0-9]+' | head -1 || true)
  TESTS_FAILED=$(echo "$OUTPUT" | grep -E '^Tests' | grep -oE '[0-9]+ failed' | grep -oE '[0-9]+' | head -1 || true)
  FILES_PASSED=$(echo "$OUTPUT" | grep -E '^Test Files' | grep -oE '[0-9]+ passed' | grep -oE '[0-9]+' | head -1 || true)
  FILES_FAILED=$(echo "$OUTPUT" | grep -E '^Test Files' | grep -oE '[0-9]+ failed' | grep -oE '[0-9]+' | head -1 || true)
  
  # Default to 0 if empty
  TESTS_PASSED=${TESTS_PASSED:-0}
  TESTS_FAILED=${TESTS_FAILED:-0}
  FILES_PASSED=${FILES_PASSED:-0}
  FILES_FAILED=${FILES_FAILED:-0}
  
  # Check if graphql.test.ts ran in this shard
  # Temporarily disable pipefail for this check to handle grep failures gracefully
  set +o pipefail
  if echo "$OUTPUT" | grep -q "graphql.test" 2>/dev/null; then
    echo "  ✓ graphql.test.ts found in this shard!"
    echo "$OUTPUT" | grep -A 10 "graphql.test" || true
  fi
  set -o pipefail
  
  echo "  Results: $TESTS_PASSED passed, $TESTS_FAILED failed"
  echo "  Files: $FILES_PASSED passed, $FILES_FAILED failed"
  echo ""
  
  TOTAL_PASSED=$((TOTAL_PASSED + TESTS_PASSED))
  TOTAL_FAILED=$((TOTAL_FAILED + TESTS_FAILED))
  TOTAL_FILES_PASSED=$((TOTAL_FILES_PASSED + FILES_PASSED))
  TOTAL_FILES_FAILED=$((TOTAL_FILES_FAILED + FILES_FAILED))
done

echo "=========================================="
echo "SUMMARY - All Shards Complete"
echo "=========================================="
echo "Total Tests: $TOTAL_PASSED passed, $TOTAL_FAILED failed"
echo "Total Files: $TOTAL_FILES_PASSED passed, $TOTAL_FILES_FAILED failed"
echo "=========================================="
