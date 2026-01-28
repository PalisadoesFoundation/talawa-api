#!/bin/bash

##################################################################################
# Talawa API - macOS Installation Script
# 
# This script installs all prerequisites for running Talawa API:
# - Homebrew (package manager)
# - Git, jq, curl (system utilities)
# - Docker Desktop (optional, based on install mode)
# - fnm (Fast Node Manager)
# - Node.js (version from package.json)
# - pnpm (version from package.json)
#
# install-macos.sh can be called directly, bypassing the main install.sh wrapper:
# - ./scripts/install/macos/install-macos.sh [INSTALL_MODE] [SKIP_PREREQS]
# - INSTALL_MODE : docker (default) | local
# - SKIP_PREREQS : true | false (default)
##################################################################################

set -euo pipefail

# Export OS_TYPE for shared libs
export OS_TYPE="macos"


# Arguments
INSTALL_MODE="${1:-docker}"
SKIP_PREREQS="${2:-false}"

# Source shared libraries
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="${SCRIPT_DIR%/macos}/common"

source "${COMMON_DIR}/logging.sh"
source "${COMMON_DIR}/os-detection.sh"
source "${COMMON_DIR}/validation.sh"
source "${COMMON_DIR}/package-manager.sh"
source "${COMMON_DIR}/docker-detection.sh"
source "${COMMON_DIR}/error-handling.sh"

setup_error_handling

print_banner "Talawa API - macOS Install"

# Validate INSTALL_MODE
if [[ "$INSTALL_MODE" != "docker" ]] && [[ "$INSTALL_MODE" != "local" ]]; then
    error "Invalid INSTALL_MODE: '$INSTALL_MODE'. Must be 'docker' or 'local'."
    exit 1
fi

# Validate SKIP_PREREQS
if [[ "$SKIP_PREREQS" != "true" ]] && [[ "$SKIP_PREREQS" != "false" ]]; then
    error "Invalid SKIP_PREREQS: '$SKIP_PREREQS'. Must be 'true' or 'false'."
    exit 1
fi

# Retry configuration
readonly MAX_RETRY_ATTEMPTS=3

# Get the repository root directory
get_repo_root() {
    local script_dir
    local repo_root
    script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    # Navigate up from scripts/install/macos to repo root
    repo_root="$(cd "$script_dir/../../.." && pwd)"
    printf '%s\n' "$repo_root"
}

REPO_ROOT=$(get_repo_root)

# Ensure we're in the repository root
cd "$REPO_ROOT"

# Local implementation of prerequisites validation (using helpers where possible)
validate_prerequisites() {
    if [ ! -f "package.json" ]; then
        error "package.json not found. Please run this script from the talawa-api repository root."
        exit 1
    fi
}
# Call validate_prerequisites
validate_prerequisites

# Total steps for progress tracking
TOTAL_STEPS=8
CURRENT_STEP=0

##############################################################################
# Step 1: Install Homebrew
##############################################################################
: $((CURRENT_STEP++))
print_step $CURRENT_STEP $TOTAL_STEPS "Checking Homebrew installation..."

if command_exists brew; then
    success "Homebrew is already installed"
else
    if [ "$SKIP_PREREQS" = "true" ]; then
        error "Homebrew is required but --skip-prereqs was specified"
        exit 1
    fi
    
    info "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL --connect-timeout 30 --max-time 300 https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH
    if [ -f /opt/homebrew/bin/brew ]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [ -f /usr/local/bin/brew ]; then
        eval "$(/usr/local/bin/brew shellenv)"
    fi
    
    success "Homebrew installed successfully"
fi

##############################################################################
# Step 2: Install system dependencies
##############################################################################
: $((CURRENT_STEP++))
print_step $CURRENT_STEP $TOTAL_STEPS "Installing system dependencies..."

if [ "$SKIP_PREREQS" = "true" ]; then
    warn "Skipping prerequisite installation (--skip-prereqs)"
else
    update_package_index
    for p in git curl jq unzip; do
        if is_package_installed "$p"; then
            success "$p is already installed"
        else
            install_package "$p"
        fi
    done
fi

##############################################################################
# Step 3: Install Docker (optional)
##############################################################################
: $((CURRENT_STEP++))
print_step $CURRENT_STEP $TOTAL_STEPS "Checking Docker installation..."

if [ "$INSTALL_MODE" = "docker" ]; then
    if command_exists docker; then
        success "Docker is already installed: $(docker --version)"
        # Verify Docker is running
        if ! docker info >/dev/null 2>&1; then
            warn "Docker is installed but not running."
            info "Please launch Docker Desktop from Applications and wait for it to start."
        else
            success "Docker is running"
        fi
    elif [ "$SKIP_PREREQS" = "true" ]; then
        warn "Skipping Docker installation (--skip-prereqs)"
    else
        warn "Docker is required for docker mode but is not installed."
        info "Please install Docker Desktop and re-run this script."
        exit 1
    fi
else
    info "Local installation mode - skipping Docker setup"
fi

##############################################################################
# Step 4: Install fnm (Fast Node Manager)
##############################################################################
: $((CURRENT_STEP++))
print_step $CURRENT_STEP $TOTAL_STEPS "Setting up Node.js version manager (fnm)..."

if command_exists fnm; then
    success "fnm is already installed"
    eval "$(fnm env)"
else
    info "Installing fnm via Homebrew..."
    brew install fnm
    
    # Set up fnm for current session
    eval "$(fnm env)"
    
    success "fnm installed successfully"
fi

##############################################################################
# Step 5: Read versions from package.json
##############################################################################
: $((CURRENT_STEP++))
print_step $CURRENT_STEP $TOTAL_STEPS "Reading configuration from package.json..."

# Extract Node.js version using safe parsing
# The 'lts' default is used if engines.node is not specified
NODE_VERSION=$(parse_package_json '.engines.node' "lts" "Node.js version (engines.node)" "false")

# SECURITY: Validate raw NODE_VERSION before any processing
# This prevents command injection via malicious package.json
if ! validate_version_string "$NODE_VERSION" "Node.js version (engines.node)"; then
    handle_version_validation_error "engines.node" "$NODE_VERSION" ".engines.node"
fi

# Clean version string (handle >=, ^, etc.)
if [[ "$NODE_VERSION" =~ ^(\^|>=|~) ]]; then
    # Extract version number after prefix (fnm handles both full semver and major-only)
    CLEAN_NODE_VERSION=$(echo "$NODE_VERSION" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || true)
    # Fallback to major version only if full semver not found
    if [ -z "$CLEAN_NODE_VERSION" ]; then
        CLEAN_NODE_VERSION=$(echo "$NODE_VERSION" | grep -oE '[0-9]+' | head -1 || true)
    fi
else
    CLEAN_NODE_VERSION="$NODE_VERSION"
fi

# Validate CLEAN_NODE_VERSION is not empty
if [ -z "$CLEAN_NODE_VERSION" ]; then
    error "Could not determine a valid Node.js version from package.json"
    echo ""
    info "Found value: '$NODE_VERSION' but could not extract version number"
    echo ""
    info "Expected formats:"
    echo "  • Exact version:  \"18.0.0\""
    echo "  • Range:          \">=18.0.0\""
    echo "  • Caret:          \"^18.0.0\""
    echo "  • Tilde:          \"~18.0.0\""
    echo ""
    info "Check package.json engines.node field:"
    echo "  jq '.engines.node' package.json"
    echo ""
    info "Falling back to LTS version"
    CLEAN_NODE_VERSION="lts"
fi

# SECURITY: Validate cleaned Node.js version before use in commands
# This is the final check before the version is passed to fnm
if ! validate_version_string "$CLEAN_NODE_VERSION" "cleaned Node.js version"; then
    handle_version_validation_error "cleaned Node.js version" "$CLEAN_NODE_VERSION" ".engines.node"
fi

# Extract pnpm version using safe parsing
PNPM_FULL=$(parse_package_json '.packageManager' "" "pnpm version (packageManager)" "false")

# Validate and extract pnpm version
if [[ "$PNPM_FULL" == pnpm@* ]]; then
    PNPM_VERSION="${PNPM_FULL#pnpm@}"
    PNPM_VERSION="${PNPM_VERSION%%+*}"  # Remove hash if present
    
    # Validate extracted pnpm version is not empty
    if [ -z "$PNPM_VERSION" ]; then
        warn "Could not extract pnpm version from '$PNPM_FULL', using latest"
        PNPM_VERSION="latest"
    fi
    
    # SECURITY: Validate pnpm version before use in commands
    if ! validate_version_string "$PNPM_VERSION" "pnpm version (packageManager)"; then
        handle_version_validation_error "packageManager" "$PNPM_VERSION" ".packageManager"
    fi
elif [ -n "$PNPM_FULL" ]; then
    # packageManager field exists but doesn't match expected pnpm format
    warn "packageManager field '$PNPM_FULL' is not in expected format 'pnpm@version'"
    info "Using latest pnpm version instead"
    PNPM_VERSION="latest"
else
    # No packageManager field specified
    info "No packageManager specified in package.json, using latest pnpm"
    PNPM_VERSION="latest"
fi

info "Target Node.js version: $CLEAN_NODE_VERSION"
info "Target pnpm version: $PNPM_VERSION"

##############################################################################
# Step 6: Install Node.js
##############################################################################
: $((CURRENT_STEP++))
print_step $CURRENT_STEP $TOTAL_STEPS "Installing Node.js v$CLEAN_NODE_VERSION..."

if [ "$CLEAN_NODE_VERSION" = "lts" ]; then
    info "Installing latest LTS version of Node.js..."
    # Install LTS and capture output to determine version
    if ! OUTPUT=$(fnm install --lts 2>&1); then
        echo "$OUTPUT"
        error "$(cat <<EOF
Failed to install LTS version of Node.js

This could be due to:
  - Network connectivity issues
  - Insufficient disk space

Troubleshooting:
  1. Check your internet connection
  2. Verify disk space: df -h
  3. Try installing manually: fnm install --lts
EOF
)"
        exit 1
    fi
    echo "$OUTPUT"

    # Extract version from output (e.g., "Installing Node v20.10.0" or "Using Node v20.10.0")
    LTS_VERSION=$(echo "$OUTPUT" | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | head -1 | sed 's/^v//' || true)
    
    if [ -z "$LTS_VERSION" ]; then
         error "Could not determine installed LTS version from fnm output"
         exit 1
    fi

    info "Detected LTS version: $LTS_VERSION"

    if ! fnm use "$LTS_VERSION"; then
         error "Failed to activate LTS version of Node.js ($LTS_VERSION)"
         exit 1
    fi
    
    fnm default "$LTS_VERSION" || echo "Warning: Failed to set LTS as default Node.js version." >&2
elif [ "$CLEAN_NODE_VERSION" = "latest" ]; then
    info "Installing latest version of Node.js..."
    if ! fnm install --latest; then
        error "Failed to install latest version of Node.js"
        exit 1
    fi
    if ! fnm use latest; then
        error "$(cat <<EOF
Failed to activate latest Node.js version

The installation succeeded but activation failed.

Troubleshooting:
  1. Verify the version was installed: fnm list
  2. Try running manually: fnm use latest
  3. If needed, reinstall: fnm install --latest
EOF
)"
        exit 1
    fi
    VERSION="$(fnm current | awk '{sub(/^v/, "", $1); print $1}')"
    fnm default "$VERSION" || echo "Warning: Failed to set latest as default Node.js version. Current session has correct version but future shells may not." >&2
else
    # Install the specified Node.js version
    info "Installing Node.js v$CLEAN_NODE_VERSION..."
    if ! fnm install "$CLEAN_NODE_VERSION"; then
        error "$(cat <<EOF
Failed to install Node.js v$CLEAN_NODE_VERSION

This could be due to:
  - Network connectivity issues
  - Insufficient disk space
  - Invalid Node.js version number
  
Troubleshooting:
  1. Check your internet connection
  2. Verify disk space: df -h
  3. Try installing manually: fnm install $CLEAN_NODE_VERSION
EOF
)"
        exit 1
    fi

    success "Node.js v$CLEAN_NODE_VERSION installed successfully"

    # Activate the installed version
    info "Activating Node.js v$CLEAN_NODE_VERSION..."
    if ! fnm use "$CLEAN_NODE_VERSION"; then
        error "$(cat <<EOF
Failed to activate Node.js v$CLEAN_NODE_VERSION
The installation succeeded but activation failed.
Try running: fnm use $CLEAN_NODE_VERSION
EOF
)"
        exit 1
    fi

    success "Node.js v$CLEAN_NODE_VERSION activated"
    fnm default "$(fnm current | awk '{sub(/^v/, "", $1); print $1}')" || echo "Warning: Failed to set Node.js v$CLEAN_NODE_VERSION as default. Current session has correct version but future shells may not." >&2
fi

# Verify Node.js is available
if ! command_exists node; then
    error "Node.js was installed but is not available in PATH"
    error "Try restarting your terminal or running: eval \"\$(fnm env)\""
    exit 1
fi

success "Node.js installed: $(node --version)"

##############################################################################
# Step 7: Install pnpm
##############################################################################
: $((CURRENT_STEP++))
print_step $CURRENT_STEP $TOTAL_STEPS "Installing pnpm v$PNPM_VERSION..."

# Verify npm is available before installing pnpm
if ! command_exists npm; then
    error "npm is not available. Node.js installation may have failed."
    echo ""
    error "Troubleshooting:"
    error "  1. Verify Node.js is installed: node --version"
    error "  2. Check if fnm environment is loaded: fnm env"
    error "  3. Try loading fnm manually: eval \"\$(fnm env)\""
    error "  4. Restart your terminal"
    echo ""
    error "If Node.js is installed but npm is missing:"
    error "  - Node.js installation may be corrupted"
    if [ "$CLEAN_NODE_VERSION" = "lts" ]; then
        error "  - Try reinstalling: fnm install --lts"
    elif [ "$CLEAN_NODE_VERSION" = "latest" ]; then
        error "  - Try reinstalling: fnm install --latest"
    else
        error "  - Try reinstalling: fnm install $CLEAN_NODE_VERSION"
    fi
    exit 1
fi

# Verify npm is working correctly
NPM_VERSION=$(npm --version 2>/dev/null || true)
if [ -z "$NPM_VERSION" ]; then
    error "npm is found but not functioning correctly"
    exit 1
fi

success "npm is available (v$NPM_VERSION)"

if command_exists pnpm; then
    CURRENT_PNPM=$(pnpm --version)

    # Normalize current version to same precision as target
    CURRENT_PNPM_NORMALIZED="$CURRENT_PNPM"
    if [[ "$PNPM_VERSION" =~ ^[0-9]+$ ]]; then
        # Target is major-only, extract major from current
        EXTRACTED=$(echo "$CURRENT_PNPM" | grep -oE '^[0-9]+' || true)
        if [ -n "$EXTRACTED" ]; then
            CURRENT_PNPM_NORMALIZED="$EXTRACTED"
        fi
    elif [[ "$PNPM_VERSION" =~ ^[0-9]+\.[0-9]+$ ]]; then
        # Target is major.minor, extract major.minor from current
        EXTRACTED=$(echo "$CURRENT_PNPM" | grep -oE '^[0-9]+\.[0-9]+' || true)
        if [ -n "$EXTRACTED" ]; then
            CURRENT_PNPM_NORMALIZED="$EXTRACTED"
        fi
    fi

    # Skip version comparison if target is "latest" - always update to ensure we have latest
    if [ "$PNPM_VERSION" = "latest" ]; then
        info "Updating pnpm to latest version..."
        if ! retry_command "$MAX_RETRY_ATTEMPTS" npm install -g "pnpm@latest"; then
            error "Failed to update pnpm to latest version after $MAX_RETRY_ATTEMPTS attempts"
            exit 1
        fi
    elif [ "$CURRENT_PNPM_NORMALIZED" = "$PNPM_VERSION" ]; then
        success "pnpm is already installed: v$CURRENT_PNPM"
    else
        info "Updating pnpm from v$CURRENT_PNPM to v$PNPM_VERSION..."
        if ! retry_command "$MAX_RETRY_ATTEMPTS" npm install -g "pnpm@$PNPM_VERSION"; then
            error "Failed to update pnpm to v$PNPM_VERSION after $MAX_RETRY_ATTEMPTS attempts"
            exit 1
        fi
    fi
else
    info "Installing pnpm..."
    if ! retry_command "$MAX_RETRY_ATTEMPTS" npm install -g "pnpm@$PNPM_VERSION"; then
        error "Failed to install pnpm v$PNPM_VERSION after $MAX_RETRY_ATTEMPTS attempts"
        exit 1
    fi
fi

# Verify pnpm is available in PATH
if ! command_exists pnpm; then
    error "pnpm installation succeeded but command not found in PATH"
    info "You may need to restart your shell or add npm global bin to PATH"
    exit 1
fi

success "pnpm installed: v$(pnpm --version)"

##############################################################################
# Step 8: Install project dependencies
##############################################################################
: $((CURRENT_STEP++))
print_step $CURRENT_STEP $TOTAL_STEPS "Installing project dependencies..."

# Make pnpm install idempotent by tracking lockfile hash (outside node_modules to survive deletion)
LOCKFILE_HASH_CACHE=".talawa-pnpm-lock-hash"
NEEDS_INSTALL=true

if [ -f "pnpm-lock.yaml" ]; then
    CURRENT_LOCKFILE_HASH=$(shasum -a 256 pnpm-lock.yaml 2>/dev/null | cut -d ' ' -f 1)
    if [ -z "$CURRENT_LOCKFILE_HASH" ]; then
        warn "Failed to compute lockfile hash, proceeding with install"
        CURRENT_LOCKFILE_HASH="unknown"
    fi    

    if [ -d "node_modules" ] && [ -f "$LOCKFILE_HASH_CACHE" ]; then
        CACHED_HASH=$(cat "$LOCKFILE_HASH_CACHE" 2>/dev/null) || CACHED_HASH=""
        if [ "$CURRENT_LOCKFILE_HASH" = "$CACHED_HASH" ]; then
            NEEDS_INSTALL=false
            success "Dependencies already up-to-date (lockfile unchanged)"
        fi
    fi
    
    if [ "$NEEDS_INSTALL" = true ]; then
        info "Installing dependencies..."
        if ! retry_command "$MAX_RETRY_ATTEMPTS" pnpm install; then
             error "Failed to install dependencies after $MAX_RETRY_ATTEMPTS attempts"
             info "Possible causes:"
             info "  - Network connectivity issues"
             info "  - Package registry temporarily unavailable"
             info "  - Corrupted pnpm cache (try: pnpm store prune)"
             exit 1
        fi
        # Cache the lockfile hash after successful install
        if [ "$CURRENT_LOCKFILE_HASH" != "unknown" ]; then
            echo "$CURRENT_LOCKFILE_HASH" > "$LOCKFILE_HASH_CACHE" 2>/dev/null || warn "Failed to cache lockfile hash"
        fi
        success "Project dependencies installed"
    fi
else
    # No lockfile exists, run install to generate it
    info "No pnpm-lock.yaml found, running fresh install..."
    if ! retry_command "$MAX_RETRY_ATTEMPTS" pnpm install; then
         error "Failed to install dependencies."
         exit 1
    fi
    # Cache the new lockfile hash
    if [ -f "pnpm-lock.yaml" ]; then
        NEW_HASH=$(shasum -a 256 pnpm-lock.yaml 2>/dev/null | cut -d ' ' -f 1)
        if [ -n "$NEW_HASH" ]; then
            echo "$NEW_HASH" > "$LOCKFILE_HASH_CACHE" 2>/dev/null || warn "Failed to cache lockfile hash"
        fi
    fi
    success "Project dependencies installed"
fi

##############################################################################
# Complete
##############################################################################
echo ""
echo "========================================"
echo "✓ Installation completed successfully!"
echo "========================================"
echo ""
info "Installed versions:"
echo "  Node.js: $(node --version)"
echo "  pnpm:    v$(pnpm --version)"
if command_exists docker; then
    echo "  Docker:  $(docker --version | cut -d ' ' -f 3 | tr -d ',')"
fi
echo ""
info "To complete setup, run:"
echo "  pnpm run setup"
echo ""
