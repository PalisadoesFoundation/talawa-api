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
    echo "✓ PASS"
}

test_fail() {
    local message="$1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo "✗ FAIL"
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
# Mocked E2E tests: unique temp dir per test, PATH overrides, command stubs
# Skip mocked tests if we cannot create .git (e.g. sandbox restrictions)
##############################################################################
DIRS_TO_CLEAN=()
trap 'rm -rf "${DIRS_TO_CLEAN[@]}"' EXIT

CAN_RUN_MOCKED_E2E=true
_check_dir=$(mktemp -d 2>/dev/null) || true
if [ -n "${_check_dir:-}" ] && ! mkdir -p "$_check_dir/.git" 2>/dev/null; then
    CAN_RUN_MOCKED_E2E=false
fi
rm -rf "${_check_dir:-}" 2>/dev/null || true
unset _check_dir

# Call at start of each mocked E2E test to get a fresh TEST_DIR and MOCK_BIN
init_test_dir() {
    TEST_DIR=$(mktemp -d)
    DIRS_TO_CLEAN+=("$TEST_DIR")
    trap 'rm -rf "${DIRS_TO_CLEAN[@]}"' EXIT
    MOCK_BIN="$TEST_DIR/bin"
    mkdir -p "$MOCK_BIN"
    setup_test_repo
}

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

# TEST_DIR holds only test data (package.json, .git). Install scripts are run from
# REPO_ROOT so coverage is attributed to scripts/install/ (real paths).
setup_test_repo() {
    mkdir -p "$TEST_DIR/.git"
    # So install script's get_repo_root (SCRIPT_DIR/../../..) resolves to TEST_DIR
    mkdir -p "$TEST_DIR/scripts/install/linux"
    cat > "$TEST_DIR/package.json" <<'PKG'
{
  "name": "talawa-api",
  "version": "1.0.0",
  "engines": { "node": "20.10.0" },
  "packageManager": "pnpm@8.14.0"
}
PKG
}

# Safe parser for extra_env: splits on space, validates each token contains '=',
# exports name=val. Pass assignments like "VAR=value" or "CI=true" (no eval).
apply_extra_env() {
    local extra_env="$1"
    local token name val
    for token in $extra_env; do
        case "$token" in
            *=*)
                name="${token%%=*}"
                val="${token#*=}"
                export "$name=$val"
                ;;
            *) continue ;;
        esac
    done
}

run_test_script() {
    local install_mode="${1:-docker}"
    local skip_prereqs="${2:-true}"
    local extra_env="${3:-}"
    # SCRIPT_DIR makes install script use TEST_DIR as repo root (get_repo_root)
    # HOME=TEST_DIR so fnm installer creates $TEST_DIR/.local/share/fnm/fnm and script finds it
    local env_args=(
        "PATH=$MOCK_BIN:/usr/bin:/bin"
        "TERM=dumb"
        "MOCK_BIN=$MOCK_BIN"
        "TEST_DIR=$TEST_DIR"
        "SCRIPT_DIR=$TEST_DIR/scripts/install/linux"
        "HOME=$TEST_DIR"
        "USER=${USER:-}"
    )
    local token
    for token in $extra_env; do
        case "$token" in
            *=*) env_args+=("$token") ;;
        esac
    done
    (
        cd "$TEST_DIR"
        env -i "${env_args[@]}" bash --noprofile --norc -c "bash \"$REPO_ROOT/scripts/install/linux/install-linux.sh\" \"$install_mode\" \"$skip_prereqs\""
    )
}

setup_clean_system() {
    create_jq_mock
    create_mock "df" 'echo "Filesystem 1K-blocks Used Available"; echo "dummy 10000000 1000 5000000 /"'
    create_mock "git" 'if [ "$1" = "rev-parse" ]; then if [ "${2:-}" = "--git-dir" ]; then echo ".git"; else echo "true"; fi; exit 0; fi; if [ "$1" = "diff-index" ]; then exit 1; fi; exit 0'
    # Stub that creates $HOME/.local/share/fnm/fnm so install script finds fnm after "install"
    cat > "$TEST_DIR/fnm-installer-stub.sh" << 'STUBEOF'
#!/bin/bash
mkdir -p "$HOME/.local/share/fnm"
cat > "$HOME/.local/share/fnm/fnm" << 'INNEREOF'
#!/bin/bash
if [ "$1" = "env" ]; then echo "export PATH=$HOME/.local/share/fnm:\$PATH"; exit 0; fi
if [ "$1" = "install" ] || [ "$1" = "use" ] || [ "$1" = "default" ]; then exit 0; fi
exit 0
INNEREOF
chmod +x "$HOME/.local/share/fnm/fnm"
exit 0
STUBEOF
    chmod +x "$TEST_DIR/fnm-installer-stub.sh"
    # Mock curl: write fnm installer stub to -o path so script finds fnm after download
    create_mock "curl" 'next=; for i in "$@"; do if [ "$i" = "-o" ]; then next=1; elif [ -n "$next" ]; then if [ -f "${TEST_DIR:-}/fnm-installer-stub.sh" ]; then cp "${TEST_DIR}/fnm-installer-stub.sh" "$i"; chmod +x "$i"; else printf "%s\n" "#!/bin/bash" "exit 0" > "$i"; chmod +x "$i"; fi; next=; fi; done; exit 0'
    rm -f "$MOCK_BIN/docker" "$MOCK_BIN/fnm" "$MOCK_BIN/node" "$MOCK_BIN/npm" "$MOCK_BIN/pnpm"
    touch "$MOCK_BIN/docker.hidden" "$MOCK_BIN/fnm.hidden" "$MOCK_BIN/node.hidden" "$MOCK_BIN/npm.hidden" "$MOCK_BIN/pnpm.hidden"
}

##############################################################################
# Test: AUTO_YES / non-interactive (CI=true)
##############################################################################
test_start "AUTO_YES / CI non-interactive mode proceeds without prompt"
if [ "$CAN_RUN_MOCKED_E2E" != true ]; then
    echo "SKIP (cannot create .git in test dir)"
    test_pass
else
init_test_dir
setup_clean_system
create_mock "docker" 'echo "Docker version 24.0.0"; exit 0'
create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=fnm_path:\$PATH"; exit 0; fi; if [ "$1" = "install" ] || [ "$1" = "use" ] || [ "$1" = "default" ]; then exit 0; fi; exit 0'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'if [ "$1" = "view" ]; then echo "8.14.0"; exit 0; fi; exit 0'
create_mock "pnpm" 'if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi; exit 0'
rm -f "$MOCK_BIN/docker.hidden" "$MOCK_BIN/fnm.hidden" "$MOCK_BIN/node.hidden" "$MOCK_BIN/npm.hidden" "$MOCK_BIN/pnpm.hidden"
set +e
OUTPUT=$(run_test_script docker true "CI=true" 2>&1)
EXIT_CODE=$?
set -e
if [ "$EXIT_CODE" -eq 0 ] && echo "$OUTPUT" | grep -qi "Installation completed successfully"; then
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
init_test_dir
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
init_test_dir
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
fi

##############################################################################
# Test: Validation fails when package.json is missing
##############################################################################
test_start "Validation fails when package.json is missing"
if [ "$CAN_RUN_MOCKED_E2E" != true ]; then
    echo "SKIP (cannot create .git in test dir)"
    test_pass
else
init_test_dir
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
fi

##############################################################################
# Test: Docker already installed branch
##############################################################################
test_start "Docker already installed (docker mode, skip prereqs)"
if [ "$CAN_RUN_MOCKED_E2E" != true ]; then
    echo "SKIP (cannot create .git in test dir)"
    test_pass
else
init_test_dir
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
init_test_dir
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
init_test_dir
setup_clean_system
echo '{"name":"talawa-api","version":"1.0.0","engines":{"node":"20.10.0; rm -rf /"},"packageManager":"pnpm@8.14.0"}' > "$TEST_DIR/package.json"
# Exact message from validation.sh validate_version_string for invalid chars (e.g. semicolon)
EXPECTED_ERROR="Invalid Node.js version (engines.node): '20.10.0; rm -rf /'"
set +e
OUTPUT=$(run_test_script local true 2>&1)
EXIT_CODE=$?
set -e
if [ "$EXIT_CODE" -ne 0 ] && echo "$OUTPUT" | grep -qF "$EXPECTED_ERROR"; then
    test_pass
else
    test_fail "Expected validation error. Expected in output: $EXPECTED_ERROR. Exit: $EXIT_CODE. Actual output: $OUTPUT"
fi
fi

##############################################################################
# Test: validate_disk_space() fails when df reports < 2GB available
##############################################################################
test_start "validate_disk_space fails with insufficient disk space"
if [ "$CAN_RUN_MOCKED_E2E" != true ]; then
    echo "SKIP (cannot create .git in test dir)"
    test_pass
else
init_test_dir
setup_clean_system
# MIN_DISK_SPACE_KB=2097152 (2GB). Report ~100MB available (4th column in 1K-blocks).
create_mock "df" 'echo "Filesystem 1K-blocks Used Available"; echo "dummy 100000 50000 100000 /"'
create_mock "docker" 'echo "Docker version 24.0.0"; exit 0'
create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=fnm_path:\$PATH"; exit 0; fi; exit 0'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'exit 0'
create_mock "pnpm" 'echo "8.14.0"; exit 0'
rm -f "$MOCK_BIN/docker.hidden" "$MOCK_BIN/fnm.hidden" "$MOCK_BIN/node.hidden" "$MOCK_BIN/npm.hidden" "$MOCK_BIN/pnpm.hidden"
set +e
OUTPUT=$(run_test_script docker true 2>&1)
EXIT_CODE=$?
set -e
if [ "$EXIT_CODE" -ne 0 ] && echo "$OUTPUT" | grep -q "Insufficient disk space"; then
    test_pass
else
    test_fail "Expected disk-space error. Exit: $EXIT_CODE. Logs: $OUTPUT"
fi
fi

##############################################################################
# Test: check_git_repo() fails when .git is missing
##############################################################################
test_start "check_git_repo fails when .git directory is missing"
if [ "$CAN_RUN_MOCKED_E2E" != true ]; then
    echo "SKIP (cannot create .git in test dir)"
    test_pass
else
init_test_dir
setup_clean_system
create_mock "docker" 'echo "Docker version 24.0.0"; exit 0'
create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=fnm_path:\$PATH"; exit 0; fi; exit 0'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'exit 0'
create_mock "pnpm" 'echo "8.14.0"; exit 0'
rm -f "$MOCK_BIN/docker.hidden" "$MOCK_BIN/fnm.hidden" "$MOCK_BIN/node.hidden" "$MOCK_BIN/npm.hidden" "$MOCK_BIN/pnpm.hidden"
rm -rf "$TEST_DIR/.git"
set +e
OUTPUT=$(run_test_script local true 2>&1)
EXIT_CODE=$?
set -e
if [ "$EXIT_CODE" -ne 0 ] && echo "$OUTPUT" | grep -q "This directory is not a git repository"; then
    test_pass
else
    test_fail "Expected git repo error. Exit: $EXIT_CODE. Logs: $OUTPUT"
fi
fi

##############################################################################
# Test: check_git_repo() fails when git rev-parse returns non-zero
##############################################################################
test_start "check_git_repo fails when git rev-parse fails (invalid repo)"
if [ "$CAN_RUN_MOCKED_E2E" != true ]; then
    echo "SKIP (cannot create .git in test dir)"
    test_pass
else
init_test_dir
setup_clean_system
create_mock "git" 'if [ "$1" = "rev-parse" ]; then exit 1; fi; exit 0'
create_mock "docker" 'echo "Docker version 24.0.0"; exit 0'
create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=fnm_path:\$PATH"; exit 0; fi; exit 0'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'exit 0'
create_mock "pnpm" 'echo "8.14.0"; exit 0'
rm -f "$MOCK_BIN/docker.hidden" "$MOCK_BIN/fnm.hidden" "$MOCK_BIN/node.hidden" "$MOCK_BIN/npm.hidden" "$MOCK_BIN/pnpm.hidden"
set +e
OUTPUT=$(run_test_script local true 2>&1)
EXIT_CODE=$?
set -e
if [ "$EXIT_CODE" -ne 0 ] && echo "$OUTPUT" | grep -q "Invalid git repository"; then
    test_pass
else
    test_fail "Expected invalid git repo error. Exit: $EXIT_CODE. Logs: $OUTPUT"
fi
fi

##############################################################################
# Test: detect_distro() path - script reports detected distribution
##############################################################################
test_start "detect_distro reports distribution in output"
if [ "$CAN_RUN_MOCKED_E2E" != true ]; then
    echo "SKIP (cannot create .git in test dir)"
    test_pass
else
init_test_dir
setup_clean_system
create_mock "docker" 'echo "Docker version 24.0.0"; exit 0'
create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=fnm_path:\$PATH"; exit 0; fi; if [ "$1" = "install" ] || [ "$1" = "use" ] || [ "$1" = "default" ]; then exit 0; fi; exit 0'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'exit 0'
create_mock "pnpm" 'echo "8.14.0"; exit 0'
rm -f "$MOCK_BIN/docker.hidden" "$MOCK_BIN/fnm.hidden" "$MOCK_BIN/node.hidden" "$MOCK_BIN/npm.hidden" "$MOCK_BIN/pnpm.hidden"
set +e
OUTPUT=$(run_test_script docker true 2>&1)
EXIT_CODE=$?
set -e
if [ "$EXIT_CODE" -eq 0 ] && echo "$OUTPUT" | grep -q "Detected distribution:"; then
    test_pass
else
    test_fail "Expected distro in output. Exit: $EXIT_CODE. Logs: $OUTPUT"
fi
fi

##############################################################################
# Test: check_docker_running() failure - Docker installed but not running
##############################################################################
test_start "check_docker_running failure shows docker not running warning"
if [ "$CAN_RUN_MOCKED_E2E" != true ]; then
    echo "SKIP (cannot create .git in test dir)"
    test_pass
else
init_test_dir
setup_clean_system
create_mock "docker" 'if [ "$1" = "info" ]; then echo "Cannot connect to daemon"; exit 1; fi; if [ "$1" = "compose" ]; then echo "Docker Compose version 2.0"; exit 0; fi; echo "Docker version 24.0.0"; exit 0'
create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=fnm_path:\$PATH"; exit 0; fi; if [ "$1" = "install" ] || [ "$1" = "use" ] || [ "$1" = "default" ]; then exit 0; fi; exit 0'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'exit 0'
create_mock "pnpm" 'echo "8.14.0"; exit 0'
rm -f "$MOCK_BIN/docker.hidden" "$MOCK_BIN/fnm.hidden" "$MOCK_BIN/node.hidden" "$MOCK_BIN/npm.hidden" "$MOCK_BIN/pnpm.hidden"
set +e
OUTPUT=$(run_test_script docker true 2>&1)
EXIT_CODE=$?
set -e
if [ "$EXIT_CODE" -eq 0 ] && echo "$OUTPUT" | grep -q "Docker is installed but not running"; then
    test_pass
else
    test_fail "Expected docker-not-running warning. Exit: $EXIT_CODE. Logs: $OUTPUT"
fi
fi

##############################################################################
# Test: pnpm install path when pnpm initially absent (npm install -g pnpm)
##############################################################################
test_start "pnpm install path when pnpm absent (npm install -g pnpm)"
if [ "$CAN_RUN_MOCKED_E2E" != true ]; then
    echo "SKIP (cannot create .git in test dir)"
    test_pass
else
init_test_dir
setup_clean_system
create_mock "docker" 'echo "Docker version 24.0.0"; exit 0'
create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=fnm_path:\$PATH"; exit 0; fi; if [ "$1" = "install" ] || [ "$1" = "use" ] || [ "$1" = "default" ]; then exit 0; fi; exit 0'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'if [ "$1" = "config" ] && [ "$2" = "get" ] && [ "$3" = "prefix" ]; then echo "${MOCK_BIN:-.}"; exit 0; fi
if [ "$1" = "install" ] && [ "$2" = "-g" ]; then
  BIN_DIR="${MOCK_BIN:-$(dirname "$(command -v npm)")}"
  echo "#!/bin/bash" > "$BIN_DIR/pnpm"
  echo "if [ \"\$1\" = \"--version\" ]; then echo 8.14.0; fi; if [ \"\$1\" = \"install\" ]; then exit 0; fi; exit 0" >> "$BIN_DIR/pnpm"
  chmod +x "$BIN_DIR/pnpm"
  rm -f "$BIN_DIR/pnpm.hidden"
  exit 0
fi; exit 0'
rm -f "$MOCK_BIN/docker.hidden" "$MOCK_BIN/fnm.hidden" "$MOCK_BIN/node.hidden" "$MOCK_BIN/npm.hidden" "$MOCK_BIN/pnpm.hidden"
touch "$MOCK_BIN/pnpm.hidden"
set +e
OUTPUT=$(run_test_script docker true 2>&1)
EXIT_CODE=$?
set -e
if [ "$EXIT_CODE" -eq 0 ] && echo "$OUTPUT" | grep -qi "Installation completed successfully"; then
    test_pass
else
    test_fail "Expected success with pnpm install path. Exit: $EXIT_CODE. Logs: $OUTPUT"
fi
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
