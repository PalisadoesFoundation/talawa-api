#!/bin/bash

##############################################################################
# Talawa API - Linux Install Script Test Suite
#
# This test suite verifies the end-to-end logic of install-linux.sh
# by mocking external commands (apt, dnf, pacman, docker, fnm, etc.) and
# running the script in a test harness.
#
# Usage: ./install-linux.test.sh
#
# Test Coverage:
# - WSL detection and Docker Desktop guidance
# - System dependency installation for Debian/RedHat/Arch families
# - apt cache freshness behavior
# - fnm/Node.js/pnpm installation paths
# - curl retry and user confirmation flows
# - Lockfile hash caching and idempotency validation
# - Error/edge cases (invalid package.json, missing deps, network failures)
# - Unsupported distribution handling
##############################################################################

set -e

# Test statistics
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
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

# Create a temporary directory for mocks and test state
TEST_DIR=$(mktemp -d)
MOCK_BIN="$TEST_DIR/bin"
mkdir -p "$MOCK_BIN"

# Create a mock package.json
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
export TERM=dumb
export AUTO_YES=true

# Clean up environment to prevent interference
unset FNM_DIR FNM_LOGLEVEL FNM_NODE_DIST_MIRROR FNM_COREPACK_ENABLED FNM_ARCH FNM_MULTISHELL_PATH FNM_RESOLVE_ENGINES FNM_VERSION_FILE_STRATEGY


##############################################################################
# Mock Helper Functions
##############################################################################

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

# Create a standalone jq mock using node for robust JSON parsing
create_jq_mock() {
    create_mock "jq" '
if [ "$1" == "--version" ]; then echo "jq-1.6"; exit 0; fi
if [ "$1" == "-r" ] && [ -f package.json ]; then
    query="$2"
    # Use node for robust JSON parsing instead of fragile sed
    if command -v node >/dev/null 2>&1; then
        if [[ "$query" == *".name"* ]]; then
            node -e "const p=require(\"./package.json\"); console.log(p.name || \"\");"
        elif [[ "$query" == *".version"* ]] && [[ "$query" != *"engines"* ]]; then
            node -e "const p=require(\"./package.json\"); console.log(p.version || \"\");"
        elif [[ "$query" == *".engines.node"* ]]; then
            node -e "const p=require(\"./package.json\"); console.log(p.engines?.node || \"\");"
        elif [[ "$query" == *".packageManager"* ]]; then
            node -e "const p=require(\"./package.json\"); console.log(p.packageManager || \"\");"
        fi
    else
        # Fallback to python if node is not available
        if [[ "$query" == *".name"* ]]; then
            python3 -c "import json; p=json.load(open(\"package.json\")); print(p.get(\"name\", \"\"))"
        elif [[ "$query" == *".version"* ]] && [[ "$query" != *"engines"* ]]; then
            python3 -c "import json; p=json.load(open(\"package.json\")); print(p.get(\"version\", \"\"))"
        elif [[ "$query" == *".engines.node"* ]]; then
            python3 -c "import json; p=json.load(open(\"package.json\")); print(p.get(\"engines\", {}).get(\"node\", \"\"))"
        elif [[ "$query" == *".packageManager"* ]]; then
            python3 -c "import json; p=json.load(open(\"package.json\")); print(p.get(\"packageManager\", \"\"))"
        fi
    fi
    exit 0
fi
exit 0
'
}

# Mock /proc/version for WSL detection
create_wsl_mock() {
    local is_wsl="$1"
    mkdir -p "$TEST_DIR/proc"
    if [ "$is_wsl" = "true" ]; then
        echo "Linux version 5.10.16.3-microsoft-standard-WSL2" > "$TEST_DIR/proc/version"
    else
        echo "Linux version 5.10.0-generic" > "$TEST_DIR/proc/version"
    fi
}

# Mock /etc/os-release for distro detection
create_distro_mock() {
    local distro="$1"
    mkdir -p "$TEST_DIR/etc"
    case "$distro" in
        ubuntu)
            cat > "$TEST_DIR/etc/os-release" <<EOF
ID=ubuntu
ID_LIKE=debian
VERSION_ID="22.04"
EOF
            ;;
        debian)
            cat > "$TEST_DIR/etc/os-release" <<EOF
ID=debian
VERSION_ID="12"
EOF
            ;;
        fedora)
            cat > "$TEST_DIR/etc/os-release" <<EOF
ID=fedora
ID_LIKE=rhel
VERSION_ID="39"
EOF
            ;;
        arch)
            cat > "$TEST_DIR/etc/os-release" <<EOF
ID=arch
EOF
            ;;
        manjaro)
            cat > "$TEST_DIR/etc/os-release" <<EOF
ID=manjaro
ID_LIKE=arch
EOF
            ;;
        unknown)
            cat > "$TEST_DIR/etc/os-release" <<EOF
ID=unknownos
EOF
            ;;
    esac
}

# Run the test subject in a subshell
run_test_script() {
    local install_mode="${1:-docker}"
    local skip_prereqs="${2:-false}"
    
    # Build the inner script as a multiline variable for readability
    local inner_script
    read -r -d '' inner_script <<INNER_SCRIPT || true
export PATH='$MOCK_BIN:/usr/bin:/bin'
export MOCK_BIN='$MOCK_BIN'
export ETC_OS_RELEASE='$TEST_DIR/etc/os-release'
export PROC_VERSION='$TEST_DIR/proc/version'
cd '$TEST_DIR'
'$TEST_DIR/scripts/install/linux/install-linux.sh' '$install_mode' '$skip_prereqs'
INNER_SCRIPT

    env -i \
        PATH="$MOCK_BIN:/usr/bin:/bin" \
        MOCK_BIN="$MOCK_BIN" \
        HOME="$HOME" \
        USER="$USER" \
        TERM="dumb" \
        AUTO_YES="true" \
        ETC_OS_RELEASE="$TEST_DIR/etc/os-release" \
        PROC_VERSION="$TEST_DIR/proc/version" \
        bash --noprofile --norc -c "$inner_script"
}

# Setup test repo structure
setup_test_repo() {
    mkdir -p "$TEST_DIR/scripts/install/linux"
    mkdir -p "$TEST_DIR/scripts/install/common"
    mkdir -p "$TEST_DIR/.git"
    
    # Copy actual scripts to test dir
    cp scripts/install/linux/install-linux.sh "$TEST_DIR/scripts/install/linux/"
    chmod +x "$TEST_DIR/scripts/install/linux/install-linux.sh"
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
}

setup_test_repo

##############################################################################
# Baseline Mocks for "Clean System"
##############################################################################

setup_clean_system() {
    # Create basic mocks
    create_jq_mock
    create_mock "git" 'if [ "$1" = "--version" ]; then echo "git version 2.0.0"; exit 0; fi; if [ "$1" = "rev-parse" ]; then exit 0; fi; if [ "$1" = "diff-index" ]; then exit 0; fi; exit 0'
    create_mock "curl" 'if [ "$1" = "--version" ]; then echo "curl 8.0.0"; exit 0; fi; exit 0'
    create_mock "unzip" 'if [ "$1" = "-v" ] || [ "$1" = "--version" ]; then echo "UnZip 6.0"; exit 0; fi; exit 0'
    
    # Package managers - default to not installed initially
    rm -rf "$MOCK_BIN/apt-get"
    rm -rf "$MOCK_BIN/dnf"
    rm -rf "$MOCK_BIN/pacman"
    
    # docker - not installed by default
    rm -rf "$MOCK_BIN/docker"
    touch "$MOCK_BIN/docker.hidden"
    
    # fnm - not installed
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
    
    # Default to Ubuntu
    create_distro_mock "ubuntu"
    create_wsl_mock "false"
    
    # Reset package.json
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
}

setup_debian_system() {
    setup_clean_system
    create_distro_mock "ubuntu"
    
    # Mock apt-get
    create_mock "apt-get" '
        if [ "$1" = "update" ]; then echo "Updating package lists..."; exit 0; fi
        if [ "$1" = "install" ]; then
            echo "Mock apt-get installed ${*:4}"
            exit 0
        fi
        exit 0
    '
    
    # Mock sudo to pass through
    create_mock "sudo" '"$@"'
}

setup_redhat_system() {
    setup_clean_system
    create_distro_mock "fedora"
    
    # Mock dnf
    create_mock "dnf" '
        if [ "$1" = "install" ]; then
            echo "Mock dnf installed ${*:4}"
            exit 0
        fi
        exit 0
    '
    
    create_mock "sudo" '"$@"'
}

setup_arch_system() {
    setup_clean_system
    create_distro_mock "arch"
    
    # Mock pacman
    create_mock "pacman" '
        if [ "$1" = "-S" ]; then
            echo "Mock pacman installed ${*:4}"
            exit 0
        fi
        exit 0
    '
    
    create_mock "sudo" '"$@"'
}

##############################################################################
# WSL Detection Tests
##############################################################################

test_start "WSL Detection - WSL Environment Detected"
setup_debian_system
create_wsl_mock "true"

# Mock all deps as installed
create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi; exit 0'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" 'if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi; if [ "$1" = "install" ]; then exit 0; fi'

set +e
OUTPUT=$(run_test_script local true 2>&1)
EXIT_CODE=$?
set -e

if [ $EXIT_CODE -eq 0 ] && echo "$OUTPUT" | grep -q "WSL Environment Detected"; then
    test_pass
else
    test_fail "Expected WSL detection message with exit code 0.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi


test_start "WSL Detection - Docker Desktop Recommendation"
setup_debian_system
create_wsl_mock "true"

create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi; exit 0'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" 'if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi; if [ "$1" = "install" ]; then exit 0; fi'

set +e
OUTPUT=$(run_test_script local true 2>&1)
EXIT_CODE=$?
set -e

if echo "$OUTPUT" | grep -q "Docker Desktop"; then
    test_pass
else
    test_fail "Expected Docker Desktop recommendation in WSL.\nLogs:\n$OUTPUT"
fi


test_start "WSL Detection - Non-WSL Environment"
setup_debian_system
create_wsl_mock "false"

create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi; exit 0'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" 'if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi; if [ "$1" = "install" ]; then exit 0; fi'

set +e
OUTPUT=$(run_test_script local true 2>&1)
EXIT_CODE=$?
set -e

if ! echo "$OUTPUT" | grep -q "WSL Environment Detected"; then
    test_pass
else
    test_fail "WSL should not be detected on native Linux.\nLogs:\n$OUTPUT"
fi


##############################################################################
# System Dependency Installation Tests (Debian/RedHat/Arch)
##############################################################################

test_start "Debian Family - apt-get Package Installation"
setup_debian_system

create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi; if [ "$1" = "install" ]; then exit 0; fi; if [ "$1" = "use" ]; then exit 0; fi; if [ "$1" = "default" ]; then exit 0; fi'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" 'if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi; if [ "$1" = "install" ]; then exit 0; fi'

set +e
OUTPUT=$(run_test_script local false 2>&1)
EXIT_CODE=$?
set -e

if [ $EXIT_CODE -eq 0 ] && echo "$OUTPUT" | grep -q "Mock apt-get installed"; then
    test_pass
else
    test_fail "Expected apt-get package installation.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi


test_start "Red Hat Family - dnf Package Installation"
setup_redhat_system

create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi; if [ "$1" = "install" ]; then exit 0; fi; if [ "$1" = "use" ]; then exit 0; fi; if [ "$1" = "default" ]; then exit 0; fi'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" 'if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi; if [ "$1" = "install" ]; then exit 0; fi'

set +e
OUTPUT=$(run_test_script local false 2>&1)
EXIT_CODE=$?
set -e

if [ $EXIT_CODE -eq 0 ] && echo "$OUTPUT" | grep -q "Mock dnf installed"; then
    test_pass
else
    test_fail "Expected dnf package installation.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi


test_start "Arch Family - pacman Package Installation"
setup_arch_system

create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi; if [ "$1" = "install" ]; then exit 0; fi; if [ "$1" = "use" ]; then exit 0; fi; if [ "$1" = "default" ]; then exit 0; fi'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" 'if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi; if [ "$1" = "install" ]; then exit 0; fi'

set +e
OUTPUT=$(run_test_script local false 2>&1)
EXIT_CODE=$?
set -e

if [ $EXIT_CODE -eq 0 ] && echo "$OUTPUT" | grep -q "Mock pacman installed"; then
    test_pass
else
    test_fail "Expected pacman package installation.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi


test_start "Unsupported Distribution - Exits with Error"
setup_clean_system
create_distro_mock "unknown"
create_mock "sudo" '"$@"'

set +e
OUTPUT=$(run_test_script local false 2>&1)
EXIT_CODE=$?
set -e

if [ $EXIT_CODE -ne 0 ] && echo "$OUTPUT" | grep -q "Unsupported distribution family"; then
    test_pass
else
    test_fail "Expected non-zero exit for unsupported distro.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi


##############################################################################
# apt Cache Freshness Tests
##############################################################################

test_start "apt Cache Fresh - Skips Update"
setup_debian_system

# Create apt lists directory with recent timestamp
mkdir -p "$TEST_DIR/var/lib/apt/lists"
touch "$TEST_DIR/var/lib/apt/lists/testfile"

# Inject apt_cache_is_fresh override into the actual script under test
# Append the override after the original function definition so it replaces it
cat >> "$TEST_DIR/scripts/install/linux/install-linux.sh" <<'EOF'

# Test override: Force apt_cache_is_fresh to return true
apt_cache_is_fresh() { return 0; }
EOF

create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi; exit 0'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" 'if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi; if [ "$1" = "install" ]; then exit 0; fi'

set +e
OUTPUT=$(run_test_script local false 2>&1)
EXIT_CODE=$?
set -e

if echo "$OUTPUT" | grep -q "up-to-date"; then
    test_pass
else
    test_fail "Expected apt cache freshness check.\nLogs:\n$OUTPUT"
fi


##############################################################################
# fnm/Node.js/pnpm Installation Tests
##############################################################################

test_start "fnm Installation - Fresh Install"
setup_debian_system

# fnm not installed initially
touch "$MOCK_BIN/fnm.hidden"

# Mock curl for fnm installer download
create_mock "curl" '
    for arg in "$@"; do
        if [[ "$arg" == *"fnm.vercel.app"* ]]; then
            echo "#!/bin/bash"
            echo "echo Installing fnm..."
            echo "rm -f $MOCK_BIN/fnm.hidden"
            echo "cat > $MOCK_BIN/fnm <<FNMEOF"
            echo "#!/bin/bash"
            echo "if [ \"\\\$1\" = \"env\" ]; then echo \"export PATH=mock:\\\$PATH\"; exit 0; fi"
            echo "if [ \"\\\$1\" = \"install\" ]; then echo \"Installing Node \\\$2\"; exit 0; fi"
            echo "if [ \"\\\$1\" = \"use\" ]; then exit 0; fi"
            echo "if [ \"\\\$1\" = \"default\" ]; then exit 0; fi"
            echo "exit 0"
            echo "FNMEOF"
            echo "chmod +x $MOCK_BIN/fnm"
            exit 0
        fi
    done
    exit 0
'

create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" 'if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi; if [ "$1" = "install" ]; then exit 0; fi'
create_mock "bash" '
    if [[ "$2" == *"fnm"* ]]; then
        echo "Installing fnm..."
        rm -f "$MOCK_BIN/fnm.hidden"
        cat > "$MOCK_BIN/fnm" <<FNMSCRIPT
#!/bin/bash
if [ "\$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi
if [ "\$1" = "install" ]; then echo "Installing Node \$2"; exit 0; fi
if [ "\$1" = "use" ]; then exit 0; fi
if [ "\$1" = "default" ]; then exit 0; fi
exit 0
FNMSCRIPT
        chmod +x "$MOCK_BIN/fnm"
        exit 0
    fi
    /bin/bash "$@"
'

set +e
OUTPUT=$(run_test_script local true 2>&1)
EXIT_CODE=$?
set -e

if echo "$OUTPUT" | grep -qE "(Installing fnm|fnm installed|fnm is already installed)"; then
    test_pass
else
    test_fail "Expected fnm installation flow.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi


test_start "Node.js Installation - Version from package.json"
setup_debian_system

create_mock "fnm" '
    if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi
    if [ "$1" = "install" ]; then echo "Installing Node $2"; exit 0; fi
    if [ "$1" = "use" ]; then exit 0; fi
    if [ "$1" = "default" ]; then exit 0; fi
'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" 'if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi; if [ "$1" = "install" ]; then exit 0; fi'

set +e
OUTPUT=$(run_test_script local true 2>&1)
EXIT_CODE=$?
set -e

if [ $EXIT_CODE -eq 0 ] && echo "$OUTPUT" | grep -qE "Installing Node.*20"; then
    test_pass
else
    test_fail "Expected Node.js 20.x installation.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi


test_start "pnpm Installation - Version from package.json"
setup_debian_system

create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi; exit 0'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" '
    if [ "$1" = "--version" ]; then echo "10.0.0"; exit 0; fi
    if [ "$1" = "install" ] && [[ "$*" == *"pnpm@8.14.0"* ]]; then
        echo "Installing pnpm@8.14.0"
        rm -f "$MOCK_BIN/pnpm.hidden"
        exit 0
    fi
    if [ "$1" = "view" ]; then echo "8.14.0"; exit 0; fi
    exit 0
'
create_mock "pnpm" 'if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi; if [ "$1" = "install" ]; then exit 0; fi'

set +e
OUTPUT=$(run_test_script local true 2>&1)
EXIT_CODE=$?
set -e

if [ $EXIT_CODE -eq 0 ] && echo "$OUTPUT" | grep -q "Target pnpm version: 8.14.0"; then
    test_pass
else
    test_fail "Expected pnpm 8.14.0 to be targeted.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi


##############################################################################
# Curl Retry Tests
##############################################################################

test_start "Curl Retry - Network Failure Recovery"
setup_debian_system

# Create a counter file to track retry attempts
echo "0" > "$TEST_DIR/.curl_attempts"

create_mock "curl" '
    ATTEMPT=$(cat "$TEST_DIR/.curl_attempts" 2>/dev/null || echo 0)
    ATTEMPT=$((ATTEMPT + 1))
    echo "$ATTEMPT" > "$TEST_DIR/.curl_attempts"
    if [ "$ATTEMPT" -lt 3 ]; then
        echo "Network error" >&2
        exit 1
    fi
    exit 0
'

create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi; exit 0'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" 'if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi; if [ "$1" = "install" ]; then exit 0; fi'

set +e
OUTPUT=$(run_test_script local true 2>&1)
EXIT_CODE=$?
set -e

# Check if retry logic was exercised
ATTEMPTS=$(cat "$TEST_DIR/.curl_attempts" 2>/dev/null || echo 0)
if [ "$ATTEMPTS" -ge 2 ]; then
    test_pass
else
    test_fail "Expected retry attempts. Attempts: $ATTEMPTS\nLogs:\n$OUTPUT"
fi


##############################################################################
# Lockfile Hash Caching Tests
##############################################################################

test_start "Lockfile Caching - First Install Creates Cache"
setup_debian_system

# Create pnpm-lock.yaml
cat > "$TEST_DIR/pnpm-lock.yaml" <<EOF
lockfileVersion: '6.0'
EOF

# Remove any existing cache
rm -f "$TEST_DIR/.git/.talawa-pnpm-lock-hash"

create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi; exit 0'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" '
    if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi
    if [ "$1" = "install" ]; then echo "Installing dependencies..."; exit 0; fi
'
create_mock "sha256sum" 'echo "abc123def456 pnpm-lock.yaml"; exit 0'

mkdir -p "$TEST_DIR/node_modules"

set +e
OUTPUT=$(run_test_script local true 2>&1)
EXIT_CODE=$?
set -e

if [ $EXIT_CODE -eq 0 ] && echo "$OUTPUT" | grep -q "Installing dependencies..."; then
    test_pass
else
    test_fail "Expected pnpm install to run.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi


test_start "Lockfile Caching - Unchanged Lockfile Skips Install"
setup_debian_system

cat > "$TEST_DIR/pnpm-lock.yaml" <<EOF
lockfileVersion: '6.0'
EOF

# Pre-populate hash cache
echo "abc123def456" > "$TEST_DIR/.git/.talawa-pnpm-lock-hash"

create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi; exit 0'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" '
    if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi
    if [ "$1" = "install" ]; then echo "SHOULD_NOT_RUN"; exit 1; fi
'
create_mock "sha256sum" 'echo "abc123def456 pnpm-lock.yaml"; exit 0'

mkdir -p "$TEST_DIR/node_modules"

set +e
OUTPUT=$(run_test_script local true 2>&1)
EXIT_CODE=$?
set -e

if [ $EXIT_CODE -eq 0 ] && echo "$OUTPUT" | grep -q "Dependencies already up-to-date" && ! echo "$OUTPUT" | grep -q "SHOULD_NOT_RUN"; then
    test_pass
else
    test_fail "Expected skip message for unchanged lockfile.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi


test_start "Lockfile Caching - Changed Lockfile Triggers Install"
setup_debian_system

cat > "$TEST_DIR/pnpm-lock.yaml" <<EOF
lockfileVersion: '6.0'
dependencies:
  - newpackage
EOF

# Pre-populate with OLD hash
echo "old_hash_value" > "$TEST_DIR/.git/.talawa-pnpm-lock-hash"

create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi; exit 0'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" '
    if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi
    if [ "$1" = "install" ]; then echo "Installing updated dependencies..."; exit 0; fi
'
create_mock "sha256sum" 'echo "new_hash_value pnpm-lock.yaml"; exit 0'

mkdir -p "$TEST_DIR/node_modules"

set +e
OUTPUT=$(run_test_script local true 2>&1)
EXIT_CODE=$?
set -e

if [ $EXIT_CODE -eq 0 ] && echo "$OUTPUT" | grep -q "Installing updated dependencies..."; then
    test_pass
else
    test_fail "Expected pnpm install for changed lockfile.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi


##############################################################################
# Error/Edge Case Tests
##############################################################################

test_start "Missing package.json - Exits with Error"
setup_debian_system
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


test_start "Invalid package.json - Wrong Repository Name"
setup_debian_system
cat > "$TEST_DIR/package.json" <<EOF
{
  "name": "wrong-repo",
  "version": "1.0.0",
  "engines": {
    "node": "20.10.0"
  },
  "packageManager": "pnpm@8.14.0"
}
EOF

set +e
OUTPUT=$(run_test_script local false 2>&1)
EXIT_CODE=$?
set -e

if [ $EXIT_CODE -ne 0 ] && echo "$OUTPUT" | grep -q "must be run from the talawa-api repository"; then
    test_pass
else
    test_fail "Expected wrong repository error.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi


test_start "Malicious Version String - Security Validation"
setup_debian_system
cat > "$TEST_DIR/package.json" <<EOF
{
  "name": "talawa-api",
  "version": "1.0.0",
  "engines": {
    "node": "20.10.0; rm -rf /"
  },
  "packageManager": "pnpm@8.14.0"
}
EOF

create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi; exit 0'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" 'echo "8.14.0"'

set +e
OUTPUT=$(run_test_script local true 2>&1)
EXIT_CODE=$?
set -e

if [ $EXIT_CODE -ne 0 ] && echo "$OUTPUT" | grep -qi "invalid"; then
    test_pass
else
    test_fail "Expected validation error for malicious version.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi


test_start "Network Failure - pnpm Install Retry Exhaustion"
setup_debian_system

cat > "$TEST_DIR/pnpm-lock.yaml" <<EOF
lockfileVersion: '6.0'
EOF

rm -f "$TEST_DIR/.git/.talawa-pnpm-lock-hash"

create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi; exit 0'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" '
    if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi
    if [ "$1" = "install" ]; then
        echo "Error: Network failure"
        exit 1
    fi
'
create_mock "sha256sum" 'echo "test_hash pnpm-lock.yaml"; exit 0'

mkdir -p "$TEST_DIR/node_modules"

set +e
OUTPUT=$(run_test_script local true 2>&1)
EXIT_CODE=$?
set -e

if [ $EXIT_CODE -ne 0 ] && echo "$OUTPUT" | grep -q "Failed to install dependencies"; then
    test_pass
else
    test_fail "Expected retry failure message.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi


test_start "Docker Mode - Docker Not Installed"
setup_debian_system
touch "$MOCK_BIN/docker.hidden"

set +e
OUTPUT=$(run_test_script docker true 2>&1)
EXIT_CODE=$?
set -e

# In docker mode without docker, script should try to install or warn
if echo "$OUTPUT" | grep -qE "(Docker|docker)"; then
    test_pass
else
    test_fail "Expected Docker-related message.\nLogs:\n$OUTPUT"
fi


test_start "Docker Mode - Docker Installer Flow"
setup_debian_system
touch "$MOCK_BIN/docker.hidden"

# Mock curl to return a fake Docker installer script
create_mock "curl" '
    for arg in "$@"; do
        if [[ "$arg" == *"get.docker.com"* ]] || [[ "$arg" == *"https://get.docker.com"* ]]; then
            # Return a fake installer that echoes a marker
            echo "#!/bin/bash"
            echo "echo DOCKER_INSTALLER_EXECUTED"
            echo "# Remove the .hidden file to simulate docker being installed"
            echo "rm -f \$MOCK_BIN/docker.hidden 2>/dev/null || true"
            exit 0
        fi
    done
    # For other curl calls, just succeed
    exit 0
'

# Mock bash to track installer execution
create_mock "bash" '
    # If running the installer script, echo our marker
    if [[ "$*" == *"/tmp/get-docker"* ]] || echo "$*" | grep -q "DOCKER_INSTALLER"; then
        echo "DOCKER_INSTALLER_EXECUTED"
        rm -f "$MOCK_BIN/docker.hidden" 2>/dev/null || true
        # Create docker mock after "installation"
        cat > "$MOCK_BIN/docker" <<DOCKERSCRIPT
#!/bin/bash
if [ "\$1" = "--version" ]; then echo "Docker version 20.10.0"; exit 0; fi
if [ "\$1" = "info" ]; then exit 0; fi
if [ "\$1" = "compose" ]; then echo "Docker Compose version 2.0.0"; exit 0; fi
exit 0
DOCKERSCRIPT
        chmod +x "$MOCK_BIN/docker"
        exit 0
    fi
    # Pass through to real bash for other commands
    /bin/bash "$@"
'

# Mock sudo to just run the command
create_mock "sudo" '"$@"'

# Setup fnm/node/pnpm mocks for the rest of the script
create_mock "fnm" '
    if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi
    exit 0
'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" '
    if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi
    if [ "$1" = "install" ]; then exit 0; fi
'

set +e
OUTPUT=$(run_test_script docker false 2>&1)
EXIT_CODE=$?
set -e

# Check that the script attempted Docker installation flow
# It should either show the installer execution or Docker installation messages
if echo "$OUTPUT" | grep -qE "(Installing Docker|DOCKER_INSTALLER_EXECUTED|Docker.*installed)"; then
    test_pass
else
    test_fail "Expected Docker installer flow execution.\nExit code: $EXIT_CODE\nLogs:\n$OUTPUT"
fi

# Cleanup mocks specific to this test
rm -f "$MOCK_BIN/bash" 2>/dev/null || true


test_start "Docker Mode - Docker Daemon Not Running"
setup_debian_system
rm -rf "$MOCK_BIN/docker"
create_mock "docker" '
    if [ "$1" = "--version" ]; then echo "Docker version 20.10.0"; exit 0; fi
    if [ "$1" = "info" ]; then exit 1; fi
'

create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi; exit 0'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" 'if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi; if [ "$1" = "install" ]; then exit 0; fi'

set +e
OUTPUT=$(run_test_script docker true 2>&1)
EXIT_CODE=$?
set -e

if echo "$OUTPUT" | grep -q "not running"; then
    test_pass
else
    test_fail "Expected Docker not running warning.\nLogs:\n$OUTPUT"
fi


test_start "Skip Prerequisites Flag"
setup_debian_system

create_mock "fnm" 'if [ "$1" = "env" ]; then echo "export PATH=mock:\$PATH"; exit 0; fi; exit 0'
create_mock "node" 'echo "v20.10.0"'
create_mock "npm" 'echo "10.0.0"'
create_mock "pnpm" 'if [ "$1" = "--version" ]; then echo "8.14.0"; exit 0; fi; if [ "$1" = "install" ]; then exit 0; fi'

set +e
OUTPUT=$(run_test_script local --skip-prereqs 2>&1)
EXIT_CODE=$?
set -e

if echo "$OUTPUT" | grep -q "Skipping prerequisite installation"; then
    test_pass
else
    test_fail "Expected skip prereqs message.\nLogs:\n$OUTPUT"
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
