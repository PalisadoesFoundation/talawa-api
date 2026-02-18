#!/bin/bash
##############################################################################
# check-traps.sh - Verify every *.test.sh in tests/install has an EXIT trap
#
# Used by lefthook pre-commit to ensure temp resources are cleaned on exit.
# Usage: ./check-traps.sh   (from repo root or tests/install)
# Returns: 0 if all have trap, 1 if any missing
##############################################################################
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"
FAILED=0
while IFS= read -r -d '' f; do
    if ! grep -q "trap.*EXIT" "$f"; then
        echo "Missing EXIT trap in $f"
        FAILED=1
    fi
done < <(find "$SCRIPT_DIR" -name "*.test.sh" -type f -print0 | sort -z)
if [ "$FAILED" -eq 1 ]; then
    echo ""
    echo "Each test file must register an EXIT trap to clean temp dirs/files."
    echo "See tests/install/README.md (Environment isolation, Execution model)."
    exit 1
fi
exit 0
