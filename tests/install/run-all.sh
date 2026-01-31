#!/bin/bash

##############################################################################
# run-all.sh - Run all installation script tests under tests/install
#
# Discovers and runs every *.test.sh in this tree. Exits non-zero if any
# test file fails. Intended to be run from repo root (e.g. pnpm test:install).
#
# Usage: ./run-all.sh   (from tests/install/) or  tests/install/run-all.sh (from repo root)
# Returns: 0 if all tests pass, 1 if any test fails
##############################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

FAILED=0
PASSED=0

while IFS= read -r -d '' test_file; do
    if bash "$test_file"; then
        PASSED=$((PASSED + 1))
    else
        FAILED=$((FAILED + 1))
    fi
done < <(find "$SCRIPT_DIR" -name "*.test.sh" -type f -print0 | sort -z)

if [ "$FAILED" -eq 0 ]; then
    echo ""
    echo "All $PASSED install script test file(s) passed."
    exit 0
else
    echo ""
    echo "$FAILED test file(s) failed, $PASSED passed."
    exit 1
fi
