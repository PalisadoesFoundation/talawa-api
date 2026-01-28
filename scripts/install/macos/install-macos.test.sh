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

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

test_start() {
    local test_name="$1"
    TESTS_RUN=$((TESTS_RUN + 1))
    echo -n "Test $TESTS_RUN: $test_name ... "
}

test_pass() {
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo -e "${GREEN}✓ PASS${NC}"
}

test_fail() {
    local message="$1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo -e "${RED}✗ FAIL${NC}"
    echo -e "  ${RED}Reason: $message${NC}"
}

# The target script to test
TARGET_SCRIPT="./install-macos.sh"

# Create a temporary directory for mocks and test state
TEST_DIR=$(mktemp -d)
MOCK_BIN="$TEST_DIR/bin"
mkdir -p "$MOCK_BIN"

# Create a mock package.json
cat > "$TEST_DIR/package.json" <<EOF
{
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
# Runs in a clean environment without fnm shell integration
run_test_script() {
    local install_mode="${1:-docker}"
    local skip_prereqs="${2:-false}"
    
    # Run in a completely clean bash subshell without any profile/rc files
    # This prevents fnm from being auto-loaded and interfering with mocks
    env -i \
        PATH="$MOCK_BIN:/usr/bin:/bin" \
        MOCK_BIN="$MOCK_BIN" \
        HOME="$HOME" \
        USER="$USER" \
        TERM="dumb" \
        bash --noprofile --norc -c "export PATH='$MOCK_BIN:/usr/bin:/bin'; export MOCK_BIN='$MOCK_BIN'; cd '$TEST_DIR' && '$TEST_DIR/scripts/install/macos/install-macos.sh' '$install_mode' '$skip_prereqs'"
}

# To effectively test, we need to replicate the repo structure in TEST_DIR
# TEST_DIR/
#   package.json
#   scripts/
#     install/
#       macos/install-macos.sh
#       common/*.sh

setup_test_repo() {
    mkdir -p "$TEST_DIR/scripts/install/macos"
    mkdir -p "$TEST_DIR/scripts/install/common"
    
    # Copy actual scripts to test dir
    cp scripts/install/macos/install-macos.sh "$TEST_DIR/scripts/install/macos/"
    chmod +x "$TEST_DIR/scripts/install/macos/install-macos.sh"
    cp scripts/install/common/*.sh "$TEST_DIR/scripts/install/common/"
    
    # Inject command_exists override into os-detection.sh
    cat >> "$TEST_DIR/scripts/install/common/os-detection.sh" <<'EOF'

command_exists() {
    if [ -n "${1:-}" ] && [ -f "${MOCK_BIN:-}/$1.hidden" ]; then
        return 1
    fi
    command -v "$1" >/dev/null 2>&1
}
EOF

    # Patch install-macos.sh to use command_exists for brew check
    # Original: if command -v brew >/dev/null 2>&1; then
    # Patch install-macos.sh to use command_exists for brew check
    # Original: if command -v brew >/dev/null 2>&1; then
}

setup_test_repo

##############################################################################
# Baseline Mocks representing a "Clean System"
##############################################################################

setup_clean_system() {
    # brew exists and works
    create_mock "brew" '
        if [ "$1" = "list" ]; then exit 1; fi # packages not installed
        if [ "$1" = "install" ]; then
            echo "Mock brew installed ${*:2}"
            rm -f "$MOCK_BIN/$2.hidden"
            exit 0
        fi
        if [ "$1" = "--version" ]; then echo "Homebrew 4.0.0"; exit 0; fi
    '
    
    # git, curl, jq, unzip - initially missing (simulated by not creating them in MOCK_BIN, but OS might have them)
    # The script uses 'is_package_installed' which calls 'brew list' on macos.
    # Our mocked brew list returns 1, so script will think they are missing and try to install them.
    
    # We need mocks for them because the script might call them after installation
    # The script calls 'git --version' and validation uses 'jq'.
    
    # Use the standalone jq mock
    create_jq_mock
    
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

test_start "Standard Install (Docker Mode) - Fresh Install"
setup_clean_system

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

# Run script
set +e
OUTPUT=$(run_test_script docker false 2>&1)
EXIT_CODE=$?
set -e

if [ $EXIT_CODE -eq 0 ]; then
    # Verify expected actions in output
    if echo "$OUTPUT" | grep -q "Mock brew installed fnm" && \
       echo "$OUTPUT" | grep -q "Mock brew installed git" && \
       echo "$OUTPUT" | grep -q "Mock brew installed --cask docker" && \
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


if echo "$OUTPUT" | grep -q "Local installation mode - skipping Docker setup"; then
    test_pass
else
    test_fail "Did not find skip message in logs.\nLogs:\n$OUTPUT"
fi

test_start "Skip Prerequisites - Warnings"
setup_clean_system
create_mock "brew" 'exit 1'
rm -rf "$MOCK_BIN/brew"
touch "$MOCK_BIN/brew.hidden"

OUTPUT=$(run_test_script docker true 2>&1 || true)
if echo "$OUTPUT" | grep -q "Homebrew is required but --skip-prereqs"; then
    test_pass
else
    test_fail "Expected failure when brew is missing and prereqs skipped.\nLogs:\n$OUTPUT"
fi

test_start "Validation - Detects Malicious Package.json"
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

OUTPUT=$(run_test_script local false 2>&1 || true)
if echo "$OUTPUT" | grep -q "Invalid"; then
    test_pass
else
    test_fail "Expected validation error for malicious version.\nLogs:\n$OUTPUT"
fi

##############################################################################
# Test: Lockfile Caching - First Install
##############################################################################
test_start "Lockfile Caching - First Install"
setup_clean_system

# Create a clean test environment for lockfile testing
cat > "$TEST_DIR/package.json" <<EOF
{
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
rm -f "$TEST_DIR/.talawa-pnpm-lock-hash"

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

OUTPUT=$(run_test_script local false 2>&1 || true)

# Verify that pnpm install was called and hash was cached
if echo "$OUTPUT" | grep -q "Installing dependencies..." && \
   [ -f "$TEST_DIR/.talawa-pnpm-lock-hash" ]; then
    test_pass
else
    test_fail "Expected pnpm install to run and cache hash.\nLogs:\n$OUTPUT"
fi

##############################################################################
# Test: Lockfile Caching - Unchanged Lockfile
##############################################################################
test_start "Lockfile Caching - Unchanged Lockfile (Idempotent)"
setup_clean_system

# Setup test environment with existing lockfile hash
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

# Pre-populate the lockfile hash cache with matching hash
echo "abc123def456" > "$TEST_DIR/.talawa-pnpm-lock-hash"

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

OUTPUT=$(run_test_script local false 2>&1 || true)

# Verify that pnpm install was NOT called (skipped due to matching hash)
if echo "$OUTPUT" | grep -q "Dependencies already up-to-date" && \
   ! echo "$OUTPUT" | grep -q "SHOULD_NOT_RUN"; then
    test_pass
else
    test_fail "Expected pnpm install to be skipped.\nLogs:\n$OUTPUT"
fi

##############################################################################
# Test: Lockfile Caching - Changed Lockfile
##############################################################################
test_start "Lockfile Caching - Changed Lockfile"
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
dependencies:
  - newpackage
EOF

# Pre-populate with OLD hash (different from current)
echo "old_hash_value_999" > "$TEST_DIR/.talawa-pnpm-lock-hash"

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

OUTPUT=$(run_test_script local false 2>&1 || true)

# Verify that pnpm install WAS called (due to hash mismatch)
if echo "$OUTPUT" | grep -q "Installing updated dependencies..." && \
   [ -f "$TEST_DIR/.talawa-pnpm-lock-hash" ]; then
    CACHED_HASH=$(cat "$TEST_DIR/.talawa-pnpm-lock-hash")
    if [ "$CACHED_HASH" = "new_hash_value_123" ]; then
        test_pass
    else
        test_fail "Hash was not updated correctly. Got: $CACHED_HASH"
    fi
else
    test_fail "Expected pnpm install to run with changed lockfile.\nLogs:\n$OUTPUT"
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

rm -f "$TEST_DIR/.talawa-pnpm-lock-hash"

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

OUTPUT=$(run_test_script local false 2>&1 || true)

# Verify that retry attempts were made and proper error was shown
if echo "$OUTPUT" | grep -q "Failed to install dependencies after .* attempts"; then
    test_pass
else
    test_fail "Expected retry failure message.\nLogs:\n$OUTPUT"
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

OUTPUT=$(run_test_script local false 2>&1 || true)

# Verify that version was correctly parsed and installed
if echo "$OUTPUT" | grep -qE "Installing Node (v?18|18\.0\.0)"; then
    test_pass
else
    test_fail "Expected Node.js 18.x.x to be installed.\nLogs:\n$OUTPUT"
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

OUTPUT=$(run_test_script local false 2>&1 || true)

# Verify version was parsed correctly
if echo "$OUTPUT" | grep -qE "Installing Node (v?20|20\.0\.0)"; then
    test_pass
else
    test_fail "Expected Node.js 20.x.x to be installed.\nLogs:\n$OUTPUT"
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

OUTPUT=$(run_test_script local false 2>&1 || true)

# Verify LTS was installed
if echo "$OUTPUT" | grep -q "Installing latest LTS version"; then
    test_pass
else
    test_fail "Expected LTS version to be installed.\nLogs:\n$OUTPUT"
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

OUTPUT=$(run_test_script local false 2>&1 || true)

# Verify pnpm version 9 was targeted
if echo "$OUTPUT" | grep -q "Target pnpm version: 9"; then
    test_pass
else
    test_fail "Expected pnpm version 9 to be extracted.\nLogs:\n$OUTPUT"
fi


##############################################################################
# Test: Missing Branches Coverage
##############################################################################

test_start "Homebrew Not Present -> Install Success"
setup_clean_system
# Simulate missing Homebrew by removing it from mock bin
rm -rf "$MOCK_BIN/brew"
touch "$MOCK_BIN/brew.hidden"

# Mock curl to simulate Homebrew installation script download and execution
create_mock "curl" '
    if [[ "$2" == *"Homebrew/install"* ]]; then
        # Output a script that "installs" brew (creates the mock)
        echo "echo \"Installing Homebrew...\"; cat > \"$MOCK_BIN/brew\" <<EOF
#!/bin/bash
if [ \"\$1\" = \"install\" ]; then echo \"Mock brew installed \$2\"; exit 0; fi
if [ \"\$1\" = \"--version\" ]; then echo \"Homebrew 4.0.0\"; exit 0; fi
EOF
chmod +x \"$MOCK_BIN/brew\""
        exit 0
    fi
    exit 0
'

create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi; if [ "$1" = "install" ]; then exit 0; fi'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" 'echo "8.14.0"; if [ "$1" = "install" ]; then exit 0; fi'
create_mock "git" 'exit 0'
create_mock "unzip" 'exit 0'

OUTPUT=$(run_test_script local false 2>&1 || true)

if echo "$OUTPUT" | grep -q "Installing Homebrew..."; then
    test_pass
else
    test_fail "Expected Homebrew installation flow.\nLogs:\n$OUTPUT"
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

OUTPUT=$(run_test_script docker false 2>&1 || true)

# The script should fail because check_docker_requirements returns 1
if echo "$OUTPUT" | grep -q "Docker is installed but not running"; then
    test_pass
else
    test_fail "Expected daemon failure warning.\nLogs:\n$OUTPUT"
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
    if [ "$1" = "current" ]; then echo "v21.0.0"; exit 0; fi
'
create_mock "node" 'echo "v21.0.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" 'echo "8.14.0"; if [ "$1" = "install" ]; then exit 0; fi'

OUTPUT=$(run_test_script local false 2>&1 || true)

if echo "$OUTPUT" | grep -q "Installing Node --latest"; then
    test_pass
else
    test_fail "Expected 'install --latest' call.\nLogs:\n$OUTPUT"
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

# Mock pnpm to return matching version
create_mock "pnpm" '
    if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi
    if [ "$1" = "install" ]; then echo "SHOULD_NOT_RUN"; exit 1; fi
'

OUTPUT=$(run_test_script local false 2>&1 || true)

if echo "$OUTPUT" | grep -q "pnpm is already installed: v8.14.0"; then
    test_pass
else
    test_fail "Expected 'already installed' message.\nLogs:\n$OUTPUT"
fi


test_start "No Lockfile (Fresh Install)"
setup_clean_system
rm -f "$TEST_DIR/pnpm-lock.yaml"
rm -f "$TEST_DIR/.talawa-pnpm-lock-hash"

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

OUTPUT=$(run_test_script local false 2>&1 || true)

if echo "$OUTPUT" | grep -q "Running pnpm install fresh..."; then
    test_pass
else
    test_fail "Expected pnpm install execution for missing lockfile.\nLogs:\n$OUTPUT"
fi

##############################################################################
# Cleanup

##############################################################################
rm -rf "$TEST_DIR"

##############################################################################
# Summary
##############################################################################
echo ""
echo "========================================================================"
echo "Test Summary"
echo "========================================================================"
echo "Total tests run:    $TESTS_RUN"
echo -e "Tests passed:       ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed:       ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    exit 0
else
    exit 1
fi
