#!/bin/bash

##############################################################################
# Talawa API - macOS Install Script Test Suite
#
# This test suite verifies the end-to-end logic of install-macos.sh
# by mocking external commands (brew, docker, fnm, etc.) and
# running the script in a test harness.
#
# Usage: ./install-macos.test.sh
##############################################################################

set -e

# Test statistics
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

# Repo root (tests live in tests/install/macos/)
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

# Create a temporary directory for mocks and test state
TEST_DIR=$(mktemp -d)
trap 'rm -rf "$TEST_DIR"' EXIT
MOCK_BIN="$TEST_DIR/bin"
mkdir -p "$MOCK_BIN"

# Create a mock package.json (name required for validation)
cat > "$TEST_DIR/package.json" <<EOF
{
  "name": "talawa-api",
  "version": "1.0.0",
  "engines": {
    "node": "20.10.0"
  },
  "packageManager": "pnpm@8.14.0"
}
EOF

# Setup environment variables for the test run
export PATH="$MOCK_BIN:$PATH"
export TERM=dumb # Disable colored output in script if possible to simplify logs

# Clean up environment to prevent interference
# Unset FNM environment variables - tests will run in isolated env without fnm shell integration
unset FNM_DIR FNM_LOGLEVEL FNM_NODE_DIST_MIRROR FNM_COREPACK_ENABLED FNM_ARCH FNM_MULTISHELL_PATH FNM_RESOLVE_ENGINES FNM_VERSION_FILE_STRATEGY


##############################################################################
# Mock Helper Functions
##############################################################################

create_mock() {
    local cmd_name="$1"
    local behavior="$2"
    
    # Remove existing mock, directory mask, or hidden marker
    rm -rf "$MOCK_BIN/$cmd_name"
    rm -f "$MOCK_BIN/$cmd_name.hidden"
    
    cat > "$MOCK_BIN/$cmd_name" <<EOF
#!/bin/bash
$behavior
EOF
    chmod +x "$MOCK_BIN/$cmd_name"
}

# Create a standalone jq mock that doesn't call the real jq
# This prevents fnm from being triggered in subprocesses
create_jq_mock() {
    create_mock "jq" '
if [ "$1" == "--version" ]; then echo "jq-1.6"; exit 0; fi
# Standalone jq mock for parsing package.json
if [ "$1" == "-r" ] && [ -f package.json ]; then
    query="$2"
    if [[ "$query" == *".engines.node"* ]]; then
        sed -n "s/.*\"node\": *\"\(.*\)\".*/\1/p" package.json | head -n 1
    elif [[ "$query" == *".packageManager"* ]]; then
        sed -n "s/.*\"packageManager\": *\"\(.*\)\".*/\1/p" package.json | head -n 1
    fi
    exit 0
fi
exit 0
'
}

# Run the test subject in a subshell with controlled pwd
# SCRIPT_DIR makes install script use TEST_DIR as repo root; HOME so fnm/state stay under TEST_DIR
run_test_script() {
    local install_mode="${1:-docker}"
    local skip_prereqs="${2:-false}"
    
    # Run in a completely clean bash subshell; REPO_ROOT so install script uses TEST_DIR
    env -i \
        PATH="$MOCK_BIN:/usr/bin:/bin" \
        MOCK_BIN="$MOCK_BIN" \
        TEST_DIR="$TEST_DIR" \
        REPO_ROOT="$TEST_DIR" \
        HOME="$TEST_DIR" \
        USER="${USER:-}" \
        TERM="dumb" \
        bash --noprofile --norc -c "export PATH='$MOCK_BIN:/usr/bin:/bin'; export MOCK_BIN='$MOCK_BIN'; export REPO_ROOT='$TEST_DIR'; export HOME='$TEST_DIR'; cd '$TEST_DIR' && exec bash '$REPO_ROOT/scripts/install/macos/install-macos.sh' '$install_mode' '$skip_prereqs'"
}

# TEST_DIR holds only test data (package.json, .git). Install scripts are run from
# REPO_ROOT so coverage is attributed to scripts/install/ (real paths).

setup_test_repo() {
    mkdir -p "$TEST_DIR/.git"
    # So install script get_repo_root (SCRIPT_DIR/../../..) resolves to TEST_DIR
    mkdir -p "$TEST_DIR/scripts/install/macos"
    # package.json already created at top of file
}

setup_test_repo

##############################################################################
# Baseline Mocks representing a "Clean System"
##############################################################################

setup_clean_system() {
    # brew exists and works
    create_mock "brew" '
        if [ "$1" = "list" ]; then exit 1; fi # packages not installed
        if [ "$1" = "update" ]; then exit 0; fi
        if [ "$1" = "install" ]; then
            echo "Mock brew installed ${*:2}"
            rm -f "$MOCK_BIN/$2.hidden"
            exit 0
        fi
        if [ "$1" = "--version" ]; then echo "Homebrew 4.0.0"; exit 0; fi
    '
    
    # Use the standalone jq mock
    create_jq_mock
    
    # Minimal mocks for tools the script may call post-install
    create_mock "git" 'if [ "$1" = "--version" ]; then echo "git version 2.0.0"; exit 0; fi'
    create_mock "curl" 'if [ "$1" = "--version" ]; then echo "curl 8.0.0"; exit 0; fi'
    create_mock "unzip" 'if [ "$1" = "-v" ] || [ "$1" = "--version" ]; then echo "UnZip 6.0"; exit 0; fi'
    
    # docker - not installed
    # In MOCK_BIN, we don"t create docker. 'command -v docker' will fail.
    # Create a directory named docker to ensure command -v fails
    rm -rf "$MOCK_BIN/docker"
    touch "$MOCK_BIN/docker.hidden"
    
    # fnm - not installed
    # Mask any system fnm by creating a hidden marker
    rm -rf "$MOCK_BIN/fnm"
    touch "$MOCK_BIN/fnm.hidden"
    
    # node - not installed
    rm -rf "$MOCK_BIN/node"
    touch "$MOCK_BIN/node.hidden"
    
    # npm - not installed
    rm -rf "$MOCK_BIN/npm"
    touch "$MOCK_BIN/npm.hidden"
    
    # pnpm - not installed
    rm -rf "$MOCK_BIN/pnpm"
    touch "$MOCK_BIN/pnpm.hidden"
}

##############################################################################
# Test Cases
##############################################################################

test_start "Standard Install (Docker Mode) - Fresh Install with Skip Prereqs"
setup_clean_system

# Mock Docker as available and running (required for docker mode with --skip-prereqs)
create_mock "docker" '
    if [ "$1" = "--version" ]; then echo "Docker version 20.10.0"; exit 0; fi
    if [ "$1" = "ps" ]; then exit 0; fi # Docker daemon is running
    if [ "$1" = "info" ]; then exit 0; fi
'

# Mock fnm to behave like it installs node
create_mock "fnm" '
    if [ "$1" = "env" ]; then echo "export PATH=fnm_path:\$PATH"; exit 0; fi
    if [ "$1" = "install" ]; then echo "Mock fnm installed Node $2 v20.10.0"; exit 0; fi
    if [ "$1" = "use" ]; then exit 0; fi
    if [ "$1" = "default" ]; then exit 0; fi
    if [ "$1" = "current" ]; then echo "v20.10.0"; exit 0; fi
'
# Hide fnm so usage of command_exists fnm returns false, triggering install
touch "$MOCK_BIN/fnm.hidden"

# Mock node and npm becoming available after fnm install
# We can't dynamically add them easily in the middle of script run unless we trap.
# But since the script just expects 'command -v node' to work after 'fnm env', 
# we can just have them available but ensure 'fnm' is installed first.
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" 'echo "8.14.0"'

# Run script with SKIP_PREREQS=true - Docker should be validated but not installed
set +e
OUTPUT=$(run_test_script docker true 2>&1)
EXIT_CODE=$?
set -e

if [ $EXIT_CODE -eq 0 ]; then
    # Verify expected actions in output (system deps are skipped, Docker is validated)
    if echo "$OUTPUT" | grep -q "Skipping prerequisite installation" && \
       echo "$OUTPUT" | grep -q "Docker is available" && \
       echo "$OUTPUT" | grep -q "Mock brew installed fnm" && \
       echo "$OUTPUT" | grep -q "Installing Node.js v20.10.0"; then
        test_pass
    else
        test_fail "Script succeeded but logs missing expected actions.\nLogs:\n$OUTPUT"
    fi
else
    test_fail "Script exited with code $EXIT_CODE\nLogs:\n$OUTPUT"
fi


test_start "Local Mode - Skips Docker"
setup_clean_system
# Mock other deps again
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" 'echo "8.14.0"'
create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=\$PATH"; exit 0; fi' 

set +e
OUTPUT=$(run_test_script local false 2>&1)
EXIT_CODE=$?
set -e


if [ $EXIT_CODE -eq 0 ]; then
    if echo "$OUTPUT" | grep -q "Local installation mode - skipping Docker setup" && \
       echo "$OUTPUT" | grep -q "Mock brew installed .*git" && \
       echo "$OUTPUT" | grep -q "Mock brew installed .*curl" && \
       echo "$OUTPUT" | grep -q "Mock brew installed .*jq" && \
       echo "$OUTPUT" | grep -q "Mock brew installed .*unzip"; then
        test_pass
    else
        test_fail "Missing expected dependency install logs.\nLogs:\n$OUTPUT"
    fi
else
    test_fail "Script exited with code $EXIT_CODE\nLogs:\n$OUTPUT"
fi

test_start "Skip Prerequisites - Warnings"
setup_clean_system
create_mock "brew" 'exit 1'
rm -rf "$MOCK_BIN/brew"
touch "$MOCK_BIN/brew.hidden"

set +e
OUTPUT=$(run_test_script docker true 2>&1)
EXIT_CODE=$?
set -e
if [ $EXIT_CODE -ne 0 ] && echo "$OUTPUT" | grep -q "Homebrew is required but --skip-prereqs"; then
    test_pass
else
    test_fail "Expected failure when brew is missing and prereqs skipped.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi

test_start "Validation - Invalid INSTALL_MODE"
setup_clean_system

set +e
OUTPUT=$(run_test_script bogus false 2>&1)
EXIT_CODE=$?
set -e
if [ $EXIT_CODE -ne 0 ] && echo "$OUTPUT" | grep -q "Invalid INSTALL_MODE"; then
    test_pass
else
    test_fail "Expected non-zero exit and validation error.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi

test_start "Validation - Invalid SKIP_PREREQS"
setup_clean_system

set +e
OUTPUT=$(run_test_script docker maybe 2>&1)
EXIT_CODE=$?
set -e
if [ $EXIT_CODE -ne 0 ] && echo "$OUTPUT" | grep -q "Invalid SKIP_PREREQS"; then
    test_pass
else
    test_fail "Expected non-zero exit and validation error.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi

test_start "Validation - Missing package.json"
setup_clean_system
rm -f "$TEST_DIR/package.json"
set +e
OUTPUT=$(run_test_script local false 2>&1)
EXIT_CODE=$?
set -e
if [ $EXIT_CODE -ne 0 ] && echo "$OUTPUT" | grep -q "package.json not found"; then
    test_pass
else
    test_fail "Expected missing package.json error.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi

test_start "Validation - Detects Malicious Package.json"
setup_clean_system
cat > "$TEST_DIR/package.json" <<EOF
{
  "engines": {
    "node": "20.10.0; rm -rf /"
  }
}
EOF
# Reset mocks
create_mock "brew" 'exit 0'
create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=\$PATH"; exit 0; fi'
create_mock "node" 'echo "v20"'
create_mock "npm" 'echo "10"'
create_mock "pnpm" 'echo "8"'
create_mock "git" 'echo "git"'
create_mock "curl" 'exit 0'
create_mock "unzip" 'exit 0'

set +e
OUTPUT=$(run_test_script local false 2>&1)
EXIT_CODE=$?
set -e
if [ $EXIT_CODE -ne 0 ] && echo "$OUTPUT" | grep -q "Invalid"; then
    test_pass
else
    test_fail "Expected validation error for malicious version.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi

##############################################################################
# Test: Lockfile Caching - First Install
##############################################################################
test_start "Lockfile Caching - First Install"
setup_clean_system

# Create a clean test environment for lockfile testing
cat > "$TEST_DIR/package.json" <<EOF
{
  "name": "talawa-api",
  "version": "1.0.0",
  "engines": {
    "node": "20.10.0"
  },
  "packageManager": "pnpm@8.14.0"
}
EOF

# Create a mock pnpm-lock.yaml
cat > "$TEST_DIR/pnpm-lock.yaml" <<EOF
lockfileVersion: '6.0'
EOF

# Remove any existing lockfile hash cache
rm -f "$TEST_DIR/.git/.talawa-pnpm-lock-hash"

# Mock all required commands
create_mock "brew" 'exit 0'
create_mock "git" 'exit 0'
create_mock "curl" 'exit 0'
create_jq_mock
create_mock "unzip" 'exit 0'
create_mock "fnm" '
    if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi
    if [ "$1" = "install" ]; then exit 0; fi
    if [ "$1" = "use" ]; then exit 0; fi
    if [ "$1" = "default" ]; then exit 0; fi
    if [ "$1" = "current" ]; then echo "v20.10.0"; exit 0; fi
'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" '
    if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi
    if [ "$1" = "install" ]; then echo "Installing dependencies..."; exit 0; fi
'
create_mock "shasum" '
    if [ "$1" = "-a" ] && [ "$2" = "256" ]; then
        echo "abc123def456 pnpm-lock.yaml"
        exit 0
    fi
'

# Create node_modules to simulate prior state
mkdir -p "$TEST_DIR/node_modules"

set +e
OUTPUT=$(run_test_script local false 2>&1)
EXIT_CODE=$?
set -e

# Verify that pnpm install was called and hash was cached, and checking for exit code 0
if [ $EXIT_CODE -eq 0 ] && \
   echo "$OUTPUT" | grep -q "Installing dependencies..." && \
   [ -f "$TEST_DIR/.git/.talawa-pnpm-lock-hash" ]; then
    test_pass
else
    test_fail "Expected pnpm install to run and cache hash with exit code 0.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi

##############################################################################
# Test: Lockfile Caching - Unchanged Lockfile
##############################################################################
test_start "Lockfile Caching - Unchanged Lockfile (Idempotent)"
setup_clean_system

# Setup test environment with existing lockfile hash
cat > "$TEST_DIR/package.json" <<EOF
{
  "name": "talawa-api",
  "version": "1.0.0",
  "engines": {
    "node": "20.10.0"
  },
  "packageManager": "pnpm@8.14.0"
}
EOF

cat > "$TEST_DIR/pnpm-lock.yaml" <<EOF
lockfileVersion: '6.0'
EOF

# Pre-populate the lockfile hash cache with matching hash
echo "abc123def456" > "$TEST_DIR/.git/.talawa-pnpm-lock-hash"

# Mock commands
create_mock "brew" 'exit 0'
create_mock "git" 'exit 0'
create_mock "curl" 'exit 0'
create_jq_mock
create_mock "unzip" 'exit 0'
create_mock "fnm" '
    if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi
    if [ "$1" = "install" ]; then exit 0; fi
    if [ "$1" = "use" ]; then exit 0; fi
    if [ "$1" = "default" ]; then exit 0; fi
    if [ "$1" = "current" ]; then echo "v20.10.0"; exit 0; fi
'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" '
    if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi
    if [ "$1" = "install" ]; then echo "SHOULD_NOT_RUN"; exit 1; fi
'
create_mock "shasum" '
    if [ "$1" = "-a" ] && [ "$2" = "256" ]; then
        echo "abc123def456 pnpm-lock.yaml"
        exit 0
    fi
'

mkdir -p "$TEST_DIR/node_modules"

set +e
OUTPUT=$(run_test_script local false 2>&1)
EXIT_CODE=$?
set -e

# Verify EXIT_CODE is 0 and that OUTPUT contains "Dependencies already up-to-date" and does not contain "SHOULD_NOT_RUN"
if [ $EXIT_CODE -eq 0 ] && \
   echo "$OUTPUT" | grep -q "Dependencies already up-to-date" && \
   ! echo "$OUTPUT" | grep -q "SHOULD_NOT_RUN"; then
    test_pass
else
    test_fail "Expected exit code 0 and skip message, but check failed.\nExit Code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi

##############################################################################
# Test: Lockfile Caching - Changed Lockfile
##############################################################################
test_start "Lockfile Caching - Changed Lockfile"
setup_clean_system

cat > "$TEST_DIR/package.json" <<EOF
{
  "name": "talawa-api",
  "version": "1.0.0",
  "engines": {
    "node": "20.10.0"
  },
  "packageManager": "pnpm@8.14.0"
}
EOF

cat > "$TEST_DIR/pnpm-lock.yaml" <<EOF
lockfileVersion: '6.0'
dependencies:
  - newpackage
EOF

# Pre-populate with OLD hash (different from current)
echo "old_hash_value_999" > "$TEST_DIR/.git/.talawa-pnpm-lock-hash"

create_mock "brew" 'exit 0'
create_mock "git" 'exit 0'
create_mock "curl" 'exit 0'
create_jq_mock
create_mock "unzip" 'exit 0'
create_mock "fnm" '
    if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi
    if [ "$1" = "install" ]; then exit 0; fi
    if [ "$1" = "use" ]; then exit 0; fi
    if [ "$1" = "default" ]; then exit 0; fi
    if [ "$1" = "current" ]; then echo "v20.10.0"; exit 0; fi
'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" '
    if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi
    if [ "$1" = "install" ]; then echo "Installing updated dependencies..."; exit 0; fi
'
create_mock "shasum" '
    if [ "$1" = "-a" ] && [ "$2" = "256" ]; then
        echo "new_hash_value_123 pnpm-lock.yaml"
        exit 0
    fi
'

mkdir -p "$TEST_DIR/node_modules"

set +e
OUTPUT=$(run_test_script local false 2>&1)
EXIT_CODE=$?
set -e

# Verify that pnpm install WAS called (due to hash mismatch) and exit code is 0
if [ $EXIT_CODE -eq 0 ] && \
   echo "$OUTPUT" | grep -q "Installing updated dependencies..." && \
   [ -f "$TEST_DIR/.git/.talawa-pnpm-lock-hash" ]; then
    CACHED_HASH=$(cat "$TEST_DIR/.git/.talawa-pnpm-lock-hash")
    if [ "$CACHED_HASH" = "new_hash_value_123" ]; then
        test_pass
    else
        test_fail "Hash was not updated correctly. Got: $CACHED_HASH"
    fi
else
    test_fail "Expected successful pnpm install with changed lockfile.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi

##############################################################################
# Test: Failed Dependency Installation with Retry
##############################################################################
test_start "Failed Dependency Installation - Retry Logic"
setup_clean_system

cat > "$TEST_DIR/package.json" <<EOF
{
  "engines": {
    "node": "20.10.0"
  },
  "packageManager": "pnpm@8.14.0"
}
EOF

cat > "$TEST_DIR/pnpm-lock.yaml" <<EOF
lockfileVersion: '6.0'
EOF

rm -f "$TEST_DIR/.git/.talawa-pnpm-lock-hash"

create_mock "brew" 'exit 0'
create_mock "git" 'exit 0'
create_mock "curl" 'exit 0'
create_jq_mock
create_mock "unzip" 'exit 0'
create_mock "fnm" '
    if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi
    if [ "$1" = "install" ]; then exit 0; fi
    if [ "$1" = "use" ]; then exit 0; fi
    if [ "$1" = "default" ]; then exit 0; fi
    if [ "$1" = "current" ]; then echo "v20.10.0"; exit 0; fi
'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" '
    if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi
    if [ "$1" = "install" ]; then
        echo "Error: Network failure"
        exit 1
    fi
'
create_mock "shasum" '
    echo "fail_hash_123 pnpm-lock.yaml"
    exit 0
'

mkdir -p "$TEST_DIR/node_modules"

set +e
OUTPUT=$(run_test_script local false 2>&1)
EXIT_CODE=$?
set -e

# Verify that retry attempts were made and proper error was shown, and exits non-zero
if [ $EXIT_CODE -ne 0 ] && echo "$OUTPUT" | grep -q "Failed to install dependencies after .* attempts"; then
    test_pass
else
    test_fail "Expected retry failure message and non-zero exit.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi

##############################################################################
# Test: Node.js Version Parsing - Caret Prefix
##############################################################################
test_start "Node.js Version Parsing - Caret Prefix (^18.0.0)"
setup_clean_system

cat > "$TEST_DIR/package.json" <<EOF
{
  "engines": {
    "node": "^18.0.0"
  },
  "packageManager": "pnpm@8.14.0"
}
EOF

create_mock "brew" 'exit 0'
create_mock "git" 'exit 0'
create_mock "curl" 'exit 0'
create_jq_mock
create_mock "unzip" 'exit 0'
create_mock "fnm" '
    if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi
    if [ "$1" = "install" ]; then
        echo "Installing Node $2"
        exit 0
    fi
    if [ "$1" = "use" ]; then exit 0; fi
    if [ "$1" = "default" ]; then exit 0; fi
    if [ "$1" = "current" ]; then echo "v18.0.0"; exit 0; fi
'
create_mock "node" 'echo "v18.0.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" '
    if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi
    if [ "$1" = "install" ]; then exit 0; fi
'

set +e
OUTPUT=$(run_test_script local false 2>&1)
EXIT_CODE=$?
set -e

# Verify that version was correctly parsed and installed
if [ $EXIT_CODE -eq 0 ] && echo "$OUTPUT" | grep -qE "Installing Node (v?18|18\.0\.0)"; then
    test_pass
else
    test_fail "Expected Node.js 18.x.x to be installed with exit code 0.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi

##############################################################################
# Test: Node.js Version Parsing - Greater Than or Equal
##############################################################################
test_start "Node.js Version Parsing - Greater Than or Equal (>=20.0.0)"
setup_clean_system

cat > "$TEST_DIR/package.json" <<EOF
{
  "engines": {
    "node": ">=20.0.0"
  },
  "packageManager": "pnpm@8.14.0"
}
EOF

create_mock "brew" 'exit 0'
create_mock "git" 'exit 0'
create_mock "curl" 'exit 0'
create_jq_mock
create_mock "unzip" 'exit 0'
create_mock "fnm" '
    if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi
    if [ "$1" = "install" ]; then
        echo "Installing Node $2"
        exit 0
    fi
    if [ "$1" = "use" ]; then exit 0; fi
    if [ "$1" = "default" ]; then exit 0; fi
    if [ "$1" = "current" ]; then echo "v20.0.0"; exit 0; fi
'
create_mock "node" 'echo "v20.0.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" '
    if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi
    if [ "$1" = "install" ]; then exit 0; fi
'

set +e
OUTPUT=$(run_test_script local false 2>&1)
EXIT_CODE=$?
set -e

# Verify version was parsed correctly
if [ $EXIT_CODE -eq 0 ] && echo "$OUTPUT" | grep -qE "Installing Node (v?20|20\.0\.0)"; then
    test_pass
else
    test_fail "Expected Node.js 20.x.x to be installed with exit code 0.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi

##############################################################################
# Test: Node.js Version Parsing - LTS keyword
##############################################################################
test_start "Node.js Version Parsing - LTS Keyword"
setup_clean_system

cat > "$TEST_DIR/package.json" <<EOF
{
  "engines": {
    "node": "lts"
  },
  "packageManager": "pnpm@8.14.0"
}
EOF

create_mock "brew" 'exit 0'
create_mock "git" 'exit 0'
create_mock "curl" 'exit 0'
create_jq_mock
create_mock "unzip" 'exit 0'
create_mock "fnm" '
    if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi
    if [ "$1" = "install" ] && [ "$2" = "--lts" ]; then
        echo "Installing Node v20.10.0 (lts/iron)"
        exit 0
    fi
    if [ "$1" = "use" ]; then exit 0; fi
    if [ "$1" = "default" ]; then exit 0; fi
    if [ "$1" = "current" ]; then echo "v20.10.0"; exit 0; fi
'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" '
    if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi
    if [ "$1" = "install" ]; then exit 0; fi
'

set +e
OUTPUT=$(run_test_script local false 2>&1)
EXIT_CODE=$?
set -e

# Verify LTS was installed
if [ $EXIT_CODE -eq 0 ] && echo "$OUTPUT" | grep -q "Installing latest LTS version"; then
    test_pass
else
    test_fail "Expected LTS version to be installed with exit code 0.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi

##############################################################################
# Test: pnpm Version Extraction - Major Only
##############################################################################
test_start "pnpm Version Extraction - Major Version Only"
setup_clean_system

cat > "$TEST_DIR/package.json" <<EOF
{
  "engines": {
    "node": "20.10.0"
  },
  "packageManager": "pnpm@9"
}
EOF

create_mock "brew" 'exit 0'
create_mock "git" 'exit 0'
create_mock "curl" 'exit 0'
create_jq_mock
create_mock "unzip" 'exit 0'
create_mock "fnm" '
    if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi
    if [ "$1" = "install" ]; then exit 0; fi
    if [ "$1" = "use" ]; then exit 0; fi
    if [ "$1" = "default" ]; then exit 0; fi
    if [ "$1" = "current" ]; then echo "v20.10.0"; exit 0; fi
'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" '
    if [ "$1" = "--version" ]; then echo "10.0.0"; exit 0; fi
    if [ "$1" = "install" ] && [[ "$*" == *"pnpm@9"* ]]; then
        echo "Installing pnpm@9"
        exit 0
    fi
'
create_mock "pnpm" '
    if [ "$1" = "--version" ]; then echo "9.0.0"; exit 0; fi
    if [ "$1" = "install" ]; then exit 0; fi
'

set +e
OUTPUT=$(run_test_script local false 2>&1)
EXIT_CODE=$?
set -e

# Verify pnpm version 9 was targeted
if [ $EXIT_CODE -eq 0 ] && echo "$OUTPUT" | grep -q "Target pnpm version: 9"; then
    test_pass
else
    test_fail "Expected pnpm version 9 to be extracted with exit code 0.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi


##############################################################################
# Test: Missing Branches Coverage
##############################################################################

test_start "Homebrew Not Present -> Install Success"
# Skip on hosts where real Homebrew exists: script may call real brew after "install", causing permission errors
if [ -x /opt/homebrew/bin/brew ] || [ -x /usr/local/bin/brew ]; then
    echo "SKIP (real Homebrew present; test runs in CI where brew is absent)"
    test_pass
else
setup_clean_system
# Simulate missing Homebrew by removing it from mock bin
rm -rf "$MOCK_BIN/brew"
touch "$MOCK_BIN/brew.hidden"

# Mock curl to simulate Homebrew installation script download and execution
create_mock "curl" '
    for arg in "$@"; do
        if [[ "$arg" == *"Homebrew/install"* ]]; then
            # Output a script that "installs" brew (creates the mock)
            echo "echo \"Installing Homebrew...\"; cat > \"$MOCK_BIN/brew\" <<EOF
#!/bin/bash
if [ \"\$1\" = \"list\" ]; then exit 1; fi
if [ \"\$1\" = \"update\" ]; then exit 0; fi
if [ \"\$1\" = \"install\" ]; then echo \"Mock brew installed \$2\"; exit 0; fi
if [ \"\$1\" = \"--version\" ]; then echo \"Homebrew 4.0.0\"; exit 0; fi
EOF
chmod +x \"$MOCK_BIN/brew\"
rm -f \"$MOCK_BIN/brew.hidden\""
            exit 0
        fi
    done
    exit 0
'

create_mock "fnm" '
    if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi
    if [ "$1" = "install" ]; then exit 0; fi
    if [ "$1" = "use" ]; then exit 0; fi
    if [ "$1" = "default" ]; then exit 0; fi
    if [ "$1" = "current" ]; then echo "v20.10.0"; exit 0; fi
'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" 'echo "8.14.0"; if [ "$1" = "install" ]; then exit 0; fi'
create_mock "git" 'exit 0'
create_mock "unzip" 'exit 0'

set +e
OUTPUT=$(run_test_script local false 2>&1)
EXIT_CODE=$?
set -e

if [ $EXIT_CODE -eq 0 ] && echo "$OUTPUT" | grep -q "Installing Homebrew..."; then
    test_pass
else
    test_fail "Expected Homebrew installation flow with exit code 0.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi
fi

test_start "Docker Missing (Docker Mode)"
setup_clean_system
# docker is already masked by setup_clean_system (docker.hidden present)

set +e
OUTPUT=$(run_test_script docker false 2>&1)
EXIT_CODE=$?
set -e

if [ $EXIT_CODE -ne 0 ] && echo "$OUTPUT" | grep -q "Docker is not installed"; then
    test_pass
else
    test_fail "Expected non-zero exit and 'Docker is not installed' message.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi

test_start "Docker Present but Daemon Down"
setup_clean_system
# Remove the directory created by setup_clean_system so we can create a file mock
rm -rf "$MOCK_BIN/docker"
# Create docker command but make info fail
create_mock "docker" '
    if [ "$1" = "--version" ]; then echo "Docker version 20.10.0"; exit 0; fi
    if [ "$1" = "info" ]; then exit 1; fi # Daemon down
'

set +e
OUTPUT=$(run_test_script docker false 2>&1)
EXIT_CODE=$?
set -e

# The script should fail because check_docker_requirements returns 1
if [ $EXIT_CODE -ne 0 ] && echo "$OUTPUT" | grep -q "Docker is installed but not running"; then
    test_pass
else
    test_fail "Expected non-zero exit and daemon failure warning.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi


test_start "Docker Present and Running"
setup_clean_system
create_mock "docker" '
    if [ "$1" = "--version" ]; then echo "Docker version 20.10.0"; exit 0; fi
    if [ "$1" = "info" ]; then exit 0; fi
'
# Mock rest of dependencies for successful run
create_mock "fnm" '
    if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi
    if [ "$1" = "install" ]; then exit 0; fi
    if [ "$1" = "use" ]; then exit 0; fi
    if [ "$1" = "default" ]; then exit 0; fi
    if [ "$1" = "current" ]; then echo "v20.10.0"; exit 0; fi
'
touch "$MOCK_BIN/fnm.hidden"
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" 'if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi; if [ "$1" = "install" ]; then exit 0; fi'
set +e
OUTPUT=$(run_test_script docker false 2>&1)
EXIT_CODE=$?
set -e
if [ $EXIT_CODE -eq 0 ] && echo "$OUTPUT" | grep -q "Docker is running"; then
    test_pass
else
    test_fail "Expected running message with exit code 0.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi


test_start "Node 'latest' Branch"
setup_clean_system
cat > "$TEST_DIR/package.json" <<EOF
{
  "engines": {
    "node": "latest"
  },
  "packageManager": "pnpm@8.14.0"
}
EOF

create_mock "brew" 'exit 0'
create_mock "git" 'exit 0'
create_mock "curl" 'exit 0'
create_jq_mock
create_mock "unzip" 'exit 0'
create_mock "fnm" '
    if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi
    if [ "$1" = "install" ] && [ "$2" = "--latest" ]; then
        echo "Installing Node --latest"
        exit 0
    fi
    if [ "$1" = "use" ]; then exit 0; fi
    if [ "$1" = "default" ]; then exit 0; fi
    if [ "$1" = "current" ]; then echo "v21.0.0"; exit 0; fi
'
create_mock "node" 'echo "v21.0.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" 'echo "8.14.0"; if [ "$1" = "install" ]; then exit 0; fi'

set +e
OUTPUT=$(run_test_script local false 2>&1)
EXIT_CODE=$?
set -e

if [ $EXIT_CODE -eq 0 ] && echo "$OUTPUT" | grep -q "Installing Node --latest"; then
    test_pass
else
    test_fail "Expected 'install --latest' call with exit code 0.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi


test_start "pnpm Already Installed (Version Match)"
setup_clean_system
# Set up package.json
cat > "$TEST_DIR/package.json" <<EOF
{
  "engines": {
    "node": "20.10.0"
  },
  "packageManager": "pnpm@8.14.0"
}
EOF

create_mock "brew" 'exit 0'
create_mock "git" 'exit 0'
create_mock "curl" 'exit 0'
create_jq_mock
create_mock "unzip" 'exit 0'
create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi; if [ "$1" = "install" ]; then exit 0; fi'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'echo "10.0.0"'

# Mock pnpm: version matches package.json (8.14.0), install (deps) must succeed
create_mock "pnpm" '
    if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi
    if [ "$1" = "install" ]; then exit 0; fi
'

set +e
OUTPUT=$(run_test_script local false 2>&1)
EXIT_CODE=$?
set -e

if [ $EXIT_CODE -eq 0 ] && echo "$OUTPUT" | grep -q "pnpm is already installed: v8.14.0"; then
    test_pass
else
    test_fail "Expected 'already installed' message with exit code 0.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi


test_start "No Lockfile (Fresh Install)"
setup_clean_system
rm -f "$TEST_DIR/pnpm-lock.yaml"
rm -f "$TEST_DIR/.git/.talawa-pnpm-lock-hash"

create_mock "brew" 'exit 0'
create_mock "git" 'exit 0'
create_mock "curl" 'exit 0'
create_jq_mock
create_mock "unzip" 'exit 0'
create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi; if [ "$1" = "install" ]; then exit 0; fi'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" '
    if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi
    if [ "$1" = "install" ]; then echo "Running pnpm install fresh..."; exit 0; fi
'

set +e
OUTPUT=$(run_test_script local false 2>&1)
EXIT_CODE=$?
set -e

if [ $EXIT_CODE -eq 0 ] && echo "$OUTPUT" | grep -q "Running pnpm install fresh..."; then
    test_pass
else
    test_fail "Expected pnpm install execution for missing lockfile with exit code 0.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi

##############################################################################
# Test: Docker Missing (Docker Mode, Skip Prereqs)
##############################################################################
test_start "Docker Missing (Docker Mode, Skip Prereqs)"
setup_clean_system
set +e
OUTPUT=$(run_test_script docker true 2>&1)
EXIT_CODE=$?
set -e
if [ $EXIT_CODE -ne 0 ] && echo "$OUTPUT" | grep -q "Docker mode requires Docker"; then
    if echo "$OUTPUT" | grep -q "Docker is not installed"; then
        test_pass
    else
        test_fail "Expected 'Docker is not installed' message.\nLogs:\n$OUTPUT"
    fi
else
    test_fail "Expected non-zero exit and failure message with --skip-prereqs.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi

##############################################################################
# Test: Docker Present but Daemon Down (Skip Prereqs)
##############################################################################
test_start "Docker Present but Daemon Down (Skip Prereqs)"
setup_clean_system
rm -rf "$MOCK_BIN/docker"
create_mock "docker" '
    if [ "$1" = "--version" ]; then echo "Docker version 20.10.0"; exit 0; fi
    if [ "$1" = "info" ]; then exit 1; fi # Daemon down
'
set +e
OUTPUT=$(run_test_script docker true 2>&1)
EXIT_CODE=$?
set -e
if [ $EXIT_CODE -ne 0 ] && echo "$OUTPUT" | grep -q "Docker mode requires Docker"; then
    if echo "$OUTPUT" | grep -q "Docker is installed but not running"; then
        test_pass
    else
        test_fail "Expected 'Docker is installed but not running' message.\nLogs:\n$OUTPUT"
    fi
else
    test_fail "Expected non-zero exit and daemon failure warning with --skip-prereqs.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi

##############################################################################
# Cleanup
##############################################################################
##############################################################################
# Summary (TEST_DIR cleaned by EXIT trap)
##############################################################################
echo ""
echo "========================================================================"
echo "Test Summary"
echo "========================================================================"
echo "Total tests run:    $TESTS_RUN"
echo "Tests passed:       $TESTS_PASSED"
echo "Tests failed:       $TESTS_FAILED"

if [ $TESTS_FAILED -eq 0 ]; then
    echo "✓ All tests passed!"
    exit 0
else
    echo "✗ Some tests failed"
    exit 1
fi
