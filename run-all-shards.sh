#!/bin/bash

# Script to run all 12 test shards and collect results

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
  OUTPUT=$(docker compose run --rm -e SHARD_INDEX=$i -e SHARD_COUNT=12 api pnpm test:shard:coverage 2>&1)
  
  # Extract test counts from vitest output
  # Vitest output format examples:
  #   "Test Files   X passed | Y failed | Z total"
  #   "Tests        X passed | Y failed | Z total"
  # Try multiple patterns to catch different output formats
  TESTS_PASSED=$(echo "$OUTPUT" | grep -E "Tests" | grep -oE '[0-9]+ passed' | grep -oE '[0-9]+' | head -1)
  TESTS_FAILED=$(echo "$OUTPUT" | grep -E "Tests" | grep -oE '[0-9]+ failed' | grep -oE '[0-9]+' | head -1)
  FILES_PASSED=$(echo "$OUTPUT" | grep -E "Test Files" | grep -oE '[0-9]+ passed' | grep -oE '[0-9]+' | head -1)
  FILES_FAILED=$(echo "$OUTPUT" | grep -E "Test Files" | grep -oE '[0-9]+ failed' | grep -oE '[0-9]+' | head -1)
  
  # Default to 0 if empty
  TESTS_PASSED=${TESTS_PASSED:-0}
  TESTS_FAILED=${TESTS_FAILED:-0}
  FILES_PASSED=${FILES_PASSED:-0}
  FILES_FAILED=${FILES_FAILED:-0}
  
  # Check if graphql.test.ts ran in this shard
  if echo "$OUTPUT" | grep -q "graphql.test"; then
    echo "  ✓ graphql.test.ts found in this shard!"
    echo "$OUTPUT" | grep -A 10 "graphql.test"
  fi
  
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
