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
  
  # Temporarily disable errexit to capture output and status even on failure
  set +e
  # Run shard and capture output
  OUTPUT=$(docker compose run --rm -e "SHARD_INDEX=$i" -e "SHARD_COUNT=12" api pnpm test:shard:coverage 2>&1)
  SHARD_STATUS=$?
  # Restore errexit
  set -e
  
  # Fail-fast if shard execution failed
  if [ "$SHARD_STATUS" -ne 0 ]; then
    echo "$OUTPUT"
    echo "Shard $i failed with exit code $SHARD_STATUS"
    exit "$SHARD_STATUS"
  fi
  
  # Extract test counts from Vitest JSON output
  # Vitest JSON reporter outputs a summary object with numPassedTests, numFailedTests, etc.
  # The JSON is typically at the end of the output after human-readable content
  # Extract JSON by finding the line containing "numPassedTests" and extracting surrounding JSON
  JSON_OUTPUT="{}"
  
  # Find the line number containing the JSON summary field
  JSON_LINE=$(echo "$OUTPUT" | grep -n '"numPassedTests"' | tail -1 | cut -d: -f1)
  if [ -n "$JSON_LINE" ]; then
    # Extract a window of lines around the JSON summary (JSON objects are typically 20-50 lines)
    # Start 5 lines before and take 50 lines to capture the complete JSON object
    TOTAL_LINES=$(echo "$OUTPUT" | wc -l | tr -d ' ')
    START_LINE=$((JSON_LINE - 5))
    if [ $START_LINE -lt 1 ]; then START_LINE=1; fi
    END_LINE=$((JSON_LINE + 45))
    if [ $END_LINE -gt $TOTAL_LINES ]; then END_LINE=$TOTAL_LINES; fi
    
    # Extract the lines and try to parse as JSON
    JSON_CANDIDATE=$(echo "$OUTPUT" | sed -n "${START_LINE},${END_LINE}p")
    
    # Validate it's valid JSON with the expected field
    if echo "$JSON_CANDIDATE" | jq -e '.numPassedTests >= 0' >/dev/null 2>&1; then
      JSON_OUTPUT="$JSON_CANDIDATE"
    fi
  fi
  
  # Fallback: try extracting from the last 100 lines if the above failed
  if [ "$JSON_OUTPUT" = "{}" ] || ! echo "$JSON_OUTPUT" | jq -e '.numPassedTests >= 0' >/dev/null 2>&1; then
    # Look for JSON in the last portion of output
    LAST_JSON=$(echo "$OUTPUT" | tail -100 | grep -A 50 '"numPassedTests"' | head -60)
    if echo "$LAST_JSON" | jq -e '.numPassedTests >= 0' >/dev/null 2>&1; then
      JSON_OUTPUT="$LAST_JSON"
    fi
  fi
  
  # Parse JSON summary with jq, defaulting to 0 if fields are missing or JSON is invalid
  TESTS_PASSED=$(echo "$JSON_OUTPUT" | jq -r '.numPassedTests // 0' 2>/dev/null || echo "0")
  TESTS_FAILED=$(echo "$JSON_OUTPUT" | jq -r '.numFailedTests // 0' 2>/dev/null || echo "0")
  FILES_PASSED=$(echo "$JSON_OUTPUT" | jq -r '.numPassedTestSuites // 0' 2>/dev/null || echo "0")
  FILES_FAILED=$(echo "$JSON_OUTPUT" | jq -r '.numFailedTestSuites // 0' 2>/dev/null || echo "0")
  
  # Ensure values are numeric (handle null/empty strings)
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
