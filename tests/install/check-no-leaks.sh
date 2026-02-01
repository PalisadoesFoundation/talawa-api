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

# Reference timestamp: only count /tmp/talawa-* files created after this (ignore pre-existing)
LEAK_REF_FILE="$LEAK_CHECK_DIR/.ref"
touch "$LEAK_REF_FILE"

# Run the full install test suite
if ! bash "$SCRIPT_DIR/run-all.sh"; then
    echo "Install tests failed; cannot verify leaks."
    exit 1
fi

# Count leftovers under TMPDIR; allow empty or only . (some shells leave . when cd'ing)
LEFTOVER_COUNT=0
if [ -d "$LEAK_CHECK_DIR" ]; then
    LEFTOVER_COUNT=$(find "$LEAK_CHECK_DIR" -mindepth 1 -maxdepth 1 2>/dev/null | wc -l | tr -d ' ')
fi

# Scan /tmp for talawa-* artifacts created after ref (ignore pre-existing); tests should clean these
TMP_TALAWA_LEAKS=0
TMP_TALAWA_LIST=""
if [ -d /tmp ] && [ -f "$LEAK_REF_FILE" ]; then
    TMP_TALAWA_LIST=$(find /tmp -maxdepth 1 -name 'talawa-*' -newer "$LEAK_REF_FILE" 2>/dev/null || true)
    if [ -n "$TMP_TALAWA_LIST" ]; then
        TMP_TALAWA_LEAKS=$(echo "$TMP_TALAWA_LIST" | wc -l | tr -d ' ')
    fi
fi

TOTAL_LEAKS=$((LEFTOVER_COUNT + TMP_TALAWA_LEAKS))

if [ "$TOTAL_LEAKS" -ne 0 ]; then
    if [ "${LEFTOVER_COUNT:-0}" -ne 0 ]; then
        echo "Leaked $LEFTOVER_COUNT item(s) under TMPDIR ($LEAK_CHECK_DIR):"
        find "$LEAK_CHECK_DIR" -mindepth 1 -maxdepth 3 2>/dev/null || true
    fi
    if [ "$TMP_TALAWA_LEAKS" -ne 0 ]; then
        echo "Leaked $TMP_TALAWA_LEAKS talawa-* file(s) under /tmp:"
        echo "$TMP_TALAWA_LIST"
    fi
    echo "Ensure all test files register EXIT traps and clean temp dirs/files."
    exit 1
fi

echo "No temp files leaked; TMPDIR was empty and no /tmp/talawa-* artifacts after test suite."
exit 0
