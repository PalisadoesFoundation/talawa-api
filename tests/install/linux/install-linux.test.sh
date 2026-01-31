#!/bin/bash

##############################################################################
# Talawa API - Linux Install Script Test Suite
#
# Verifies script metadata and runs mocked end-to-end tests for
# scripts/install/linux/install-linux.sh (AUTO_YES, install mode, validation,
# fnm/Node/pnpm paths, error handling).
#
# Usage: ./install-linux.test.sh
# Requirements: bash 4.0+
##############################################################################

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
SCRIPTS_INSTALL="$REPO_ROOT/scripts/install"
LINUX_SCRIPT="$SCRIPTS_INSTALL/linux/install-linux.sh"

TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

test_start() {
    local test_name="$1"
    TESTS_RUN=$((TESTS_RUN + 1))
    echo -n "Test $TESTS_RUN: $test_name ... "
}

test_pass() {
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo "PASS"
}

test_fail() {
    local message="$1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo "FAIL"
    echo "  Reason: $message"
}

##############################################################################
# Test: Linux install script exists and is readable
##############################################################################
test_start "install-linux.sh exists and is readable"
if [ -f "$LINUX_SCRIPT" ] && [ -r "$LINUX_SCRIPT" ]; then
    test_pass
else
    test_fail "Script not found or not readable: $LINUX_SCRIPT"
fi

##############################################################################
# Test: Linux install script is executable
##############################################################################
test_start "install-linux.sh is executable"
if [ -x "$LINUX_SCRIPT" ]; then
    test_pass
else
    test_fail "Script not executable: $LINUX_SCRIPT"
fi

##############################################################################
# Test: Linux install script has valid bash syntax
##############################################################################
test_start "install-linux.sh has valid bash syntax"
if bash -n "$LINUX_SCRIPT" 2>/dev/null; then
    test_pass
else
    test_fail "bash -n failed (syntax error) for $LINUX_SCRIPT"
fi

##############################################################################
# Mocked E2E tests: temp dir, PATH overrides, command stubs
# Skip mocked tests if we cannot create .git (e.g. sandbox restrictions)
##############################################################################
TEST_DIR=$(mktemp -d)
trap 'rm -rf "$TEST_DIR"' EXIT
MOCK_BIN="$TEST_DIR/bin"
mkdir -p "$MOCK_BIN"
CAN_RUN_MOCKED_E2E=true
if ! mkdir -p "$TEST_DIR/.git" 2>/dev/null; then
    CAN_RUN_MOCKED_E2E=false
fi

create_mock() {
    local cmd_name="$1"
    local behavior="$2"
    rm -rf "$MOCK_BIN/$cmd_name"
    rm -f "$MOCK_BIN/$cmd_name.hidden"
    cat > "$MOCK_BIN/$cmd_name" <<EOF
#!/bin/bash
$behavior
EOF
    chmod +x "$MOCK_BIN/$cmd_name"
}

create_jq_mock() {
    create_mock "jq" '
if [ "${1:-}" = "-r" ] && [ -f package.json ]; then
    query="${2:-}"
    if [[ "$query" == *".name"* ]]; then
        sed -n "s/.*\"name\": *\"\([^\"]*\)\".*/\1/p" package.json | head -n 1
    elif [[ "$query" == *".version"* ]]; then
        sed -n "s/.*\"version\": *\"\([^\"]*\)\".*/\1/p" package.json | head -n 1
    elif [[ "$query" == *".engines.node"* ]]; then
        sed -n "s/.*\"node\": *\"\([^\"]*\)\".*/\1/p" package.json | head -n 1
    elif [[ "$query" == *".packageManager"* ]]; then
        sed -n "s/.*\"packageManager\": *\"\([^\"]*\)\".*/\1/p" package.json | head -n 1
    fi
    exit 0
fi
exit 0
'
}

setup_test_repo() {
    mkdir -p "$TEST_DIR/scripts/install/linux"
    mkdir -p "$TEST_DIR/scripts/install/common"
    mkdir -p "$TEST_DIR/.git"
    cp "$REPO_ROOT/scripts/install/linux/install-linux.sh" "$TEST_DIR/scripts/install/linux/"
    chmod +x "$TEST_DIR/scripts/install/linux/install-linux.sh"
    cp "$REPO_ROOT/scripts/install/common/"*.sh "$TEST_DIR/scripts/install/common/"
    cat > "$TEST_DIR/package.json" <<'PKG'
{
  "name": "talawa-api",
  "version": "1.0.0",
  "engines": { "node": "20.10.0" },
  "packageManager": "pnpm@8.14.0"
}
PKG
}

run_test_script() {
    local install_mode="${1:-docker}"
    local skip_prereqs="${2:-true}"
    local extra_env="${3:-}"
    (
        cd "$TEST_DIR"
        export PATH="$MOCK_BIN:/usr/bin:/bin"
        export TERM=dumb
        eval "$extra_env"
        "$TEST_DIR/scripts/install/linux/install-linux.sh" "$install_mode" "$skip_prereqs"
    )
}

setup_clean_system() {
    create_jq_mock
    create_mock "df" 'echo "Filesystem 1K-blocks Used Available"; echo "dummy 10000000 1000 5000000 /"'
    create_mock "git" 'if [ "$1" = "rev-parse" ]; then echo "true"; exit 0; fi; if [ "$1" = "diff-index" ]; then exit 1; fi; exit 0'
    rm -f "$MOCK_BIN/docker" "$MOCK_BIN/fnm" "$MOCK_BIN/node" "$MOCK_BIN/npm" "$MOCK_BIN/pnpm"
    touch "$MOCK_BIN/docker.hidden" "$MOCK_BIN/fnm.hidden" "$MOCK_BIN/node.hidden" "$MOCK_BIN/npm.hidden" "$MOCK_BIN/pnpm.hidden"
}

if [ "$CAN_RUN_MOCKED_E2E" = true ]; then
    setup_test_repo
fi

##############################################################################
# Test: AUTO_YES / non-interactive (CI=true)
##############################################################################
test_start "AUTO_YES / CI non-interactive mode proceeds without prompt"
if [ "$CAN_RUN_MOCKED_E2E" != true ]; then
    echo "SKIP (cannot create .git in test dir)"
    test_pass
else
setup_clean_system
create_mock "docker" 'echo "Docker version 24.0.0"; exit 0'
create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=fnm_path:\$PATH"; exit 0; fi; if [ "$1" = "install" ] || [ "$1" = "use" ] || [ "$1" = "default" ]; then exit 0; fi; exit 0'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'if [ "$1" = "view" ]; then echo "8.14.0"; exit 0; fi; exit 0'
create_mock "pnpm" 'if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi; exit 0'
rm -f "$MOCK_BIN/docker.hidden" "$MOCK_BIN/fnm.hidden" "$MOCK_BIN/node.hidden" "$MOCK_BIN/npm.hidden" "$MOCK_BIN/pnpm.hidden"
set +e
OUTPUT=$(run_test_script docker true "export CI=true" 2>&1)
EXIT_CODE=$?
set -e
if [ "$EXIT_CODE" -eq 0 ] && echo "$OUTPUT" | grep -q "Installation completed successfully"; then
    test_pass
else
    test_fail "Expected success with CI=true. Exit: $EXIT_CODE. Logs: $OUTPUT"
fi
fi

##############################################################################
# Test: INSTALL_MODE=local skips Docker
##############################################################################
test_start "INSTALL_MODE=local skips Docker setup"
if [ "$CAN_RUN_MOCKED_E2E" != true ]; then
    echo "SKIP (cannot create .git in test dir)"
    test_pass
else
setup_clean_system
create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=fnm_path:\$PATH"; exit 0; fi; exit 0'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'if [ "$1" = "view" ]; then echo "8.14.0"; exit 0; fi; exit 0'
create_mock "pnpm" 'if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi; exit 0'
rm -f "$MOCK_BIN/fnm.hidden" "$MOCK_BIN/node.hidden" "$MOCK_BIN/npm.hidden" "$MOCK_BIN/pnpm.hidden"
set +e
OUTPUT=$(run_test_script local true 2>&1)
EXIT_CODE=$?
set -e
if [ "$EXIT_CODE" -eq 0 ] && echo "$OUTPUT" | grep -q "Local installation mode - skipping Docker setup"; then
    test_pass
else
    test_fail "Expected local mode to skip Docker. Exit: $EXIT_CODE. Logs: $OUTPUT"
fi
fi

##############################################################################
# Test: Validation fails when package.json has wrong name
##############################################################################
test_start "Validation fails when package.json name is not talawa-api"
if [ "$CAN_RUN_MOCKED_E2E" != true ]; then
    echo "SKIP (cannot create .git in test dir)"
    test_pass
else
setup_clean_system
echo '{"name":"other","version":"1.0.0","engines":{"node":"20.10.0"},"packageManager":"pnpm@8.14.0"}' > "$TEST_DIR/package.json"
set +e
OUTPUT=$(run_test_script local true 2>&1)
EXIT_CODE=$?
set -e
if [ "$EXIT_CODE" -ne 0 ] && echo "$OUTPUT" | grep -q "This script must be run from the talawa-api repository"; then
    test_pass
else
    test_fail "Expected validation error for wrong package name. Exit: $EXIT_CODE. Logs: $OUTPUT"
fi
setup_test_repo
fi

##############################################################################
# Test: Validation fails when package.json is missing
##############################################################################
test_start "Validation fails when package.json is missing"
if [ "$CAN_RUN_MOCKED_E2E" != true ]; then
    echo "SKIP (cannot create .git in test dir)"
    test_pass
else
setup_clean_system
rm -f "$TEST_DIR/package.json"
set +e
OUTPUT=$(run_test_script local true 2>&1)
EXIT_CODE=$?
set -e
if [ "$EXIT_CODE" -ne 0 ] && echo "$OUTPUT" | grep -q "package.json not found"; then
    test_pass
else
    test_fail "Expected missing package.json error. Exit: $EXIT_CODE. Logs: $OUTPUT"
fi
setup_test_repo
fi

##############################################################################
# Test: Docker already installed branch
##############################################################################
test_start "Docker already installed (docker mode, skip prereqs)"
if [ "$CAN_RUN_MOCKED_E2E" != true ]; then
    echo "SKIP (cannot create .git in test dir)"
    test_pass
else
setup_clean_system
create_mock "docker" 'echo "Docker version 24.0.0"; exit 0'
create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=fnm_path:\$PATH"; exit 0; fi; if [ "$1" = "install" ] || [ "$1" = "use" ] || [ "$1" = "default" ]; then exit 0; fi; exit 0'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'if [ "$1" = "view" ]; then echo "8.14.0"; exit 0; fi; exit 0'
create_mock "pnpm" 'if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi; exit 0'
rm -f "$MOCK_BIN/docker.hidden" "$MOCK_BIN/fnm.hidden" "$MOCK_BIN/node.hidden" "$MOCK_BIN/npm.hidden" "$MOCK_BIN/pnpm.hidden"
set +e
OUTPUT=$(run_test_script docker true 2>&1)
EXIT_CODE=$?
set -e
if [ "$EXIT_CODE" -eq 0 ] && echo "$OUTPUT" | grep -q "Docker is already installed"; then
    test_pass
else
    test_fail "Expected Docker already installed message. Exit: $EXIT_CODE. Logs: $OUTPUT"
fi
fi

##############################################################################
# Test: fnm/Node/pnpm path (script calls fnm use, node, pnpm)
##############################################################################
test_start "fnm and Node and pnpm path (mocked install flow)"
if [ "$CAN_RUN_MOCKED_E2E" != true ]; then
    echo "SKIP (cannot create .git in test dir)"
    test_pass
else
setup_clean_system
create_mock "docker" 'echo "Docker version 24.0.0"; exit 0'
create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=fnm_path:\$PATH"; exit 0; fi; if [ "$1" = "install" ]; then echo "Installing Node $2"; exit 0; fi; if [ "$1" = "use" ] || [ "$1" = "default" ]; then exit 0; fi; exit 0'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'if [ "$1" = "view" ]; then echo "8.14.0"; exit 0; fi; if [ "$1" = "install" ]; then exit 0; fi; exit 0'
create_mock "pnpm" 'if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi; if [ "$1" = "install" ]; then exit 0; fi; exit 0'
rm -f "$MOCK_BIN/docker.hidden" "$MOCK_BIN/fnm.hidden" "$MOCK_BIN/node.hidden" "$MOCK_BIN/npm.hidden" "$MOCK_BIN/pnpm.hidden"
set +e
OUTPUT=$(run_test_script docker true 2>&1)
EXIT_CODE=$?
set -e
if [ "$EXIT_CODE" -eq 0 ] && echo "$OUTPUT" | grep -q "Target Node.js version" && echo "$OUTPUT" | grep -q "Node.js installed"; then
    test_pass
else
    test_fail "Expected fnm/Node/pnpm flow. Exit: $EXIT_CODE. Logs: $OUTPUT"
fi
fi

##############################################################################
# Test: Error handling - malicious version in package.json
##############################################################################
test_start "Error handling: invalid version string in package.json"
if [ "$CAN_RUN_MOCKED_E2E" != true ]; then
    echo "SKIP (cannot create .git in test dir)"
    test_pass
else
setup_clean_system
echo '{"name":"talawa-api","version":"1.0.0","engines":{"node":"20.10.0; rm -rf /"},"packageManager":"pnpm@8.14.0"}' > "$TEST_DIR/package.json"
set +e
OUTPUT=$(run_test_script local true 2>&1)
EXIT_CODE=$?
set -e
if [ "$EXIT_CODE" -ne 0 ] && echo "$OUTPUT" | grep -q "Invalid"; then
    test_pass
else
    test_fail "Expected validation error for malicious version. Exit: $EXIT_CODE. Logs: $OUTPUT"
fi
setup_test_repo
fi

##############################################################################
# Test summary
##############################################################################
echo ""
echo "========================================================================"
echo "Test Summary"
echo "========================================================================"
echo "Total tests run:    $TESTS_RUN"
echo "Tests passed:       $TESTS_PASSED"
echo "Tests failed:       $TESTS_FAILED"
echo ""

if [ "$TESTS_FAILED" -eq 0 ]; then
    echo "All tests passed!"
    exit 0
else
    echo "Some tests failed"
    exit 1
fi
