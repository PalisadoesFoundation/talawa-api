#!/bin/bash
##############################################################################
# check-no-leaks.sh - Run install tests in an isolated TMPDIR and verify no
# temporary files or directories are left behind after the suite exits.
#
# Ensures EXIT traps and cleanup in test files work; fails if any temp
# resources leak (e.g. mktemp dirs, /tmp/talawa-* files).
#
# Usage: ./check-no-leaks.sh   (from repo root or tests/install)
# Returns: 0 if no leaks, 1 if leaks or tests failed
# Requirements: bash, tests/install/run-all.sh
##############################################################################
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

# Use a dedicated TMPDIR so all mktemp and /tmp usage from tests goes here
LEAK_CHECK_DIR=$(mktemp -d)
trap 'rm -rf "$LEAK_CHECK_DIR"' EXIT
export TMPDIR="$LEAK_CHECK_DIR"

# Run the full install test suite
if ! bash "$SCRIPT_DIR/run-all.sh"; then
    echo "Install tests failed; cannot verify leaks."
    exit 1
fi

# Count leftovers; allow empty or only . (some shells leave . when cd'ing)
LEFTOVER_COUNT=0
if [ -d "$LEAK_CHECK_DIR" ]; then
    LEFTOVER_COUNT=$(find "$LEAK_CHECK_DIR" -mindepth 1 -maxdepth 1 2>/dev/null | wc -l | tr -d ' ')
fi

if [ "${LEFTOVER_COUNT:-0}" -ne 0 ]; then
    echo "Leaked $LEFTOVER_COUNT item(s) under TMPDIR ($LEAK_CHECK_DIR):"
    find "$LEAK_CHECK_DIR" -mindepth 1 -maxdepth 3 2>/dev/null || true
    echo "Ensure all test files register EXIT traps and clean temp dirs/files."
    exit 1
fi

echo "No temp files leaked; TMPDIR was empty after test suite."
exit 0
