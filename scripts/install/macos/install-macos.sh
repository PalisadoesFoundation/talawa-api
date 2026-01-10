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

# Arguments
INSTALL_MODE="${1:-docker}"
SKIP_PREREQS="${2:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Print functions
info() { echo -e "${BLUE}ℹ${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }
step() { echo -e "${CYAN}[$1/$2]${NC} $3"; }
print_usage() {
    error "Usage: $0 [INSTALL_MODE] [SKIP_PREREQS]"
    error "  INSTALL_MODE : docker (default) | local"
    error "  SKIP_PREREQS : true | false (default)"
}

# Validate INSTALL_MODE
if [[ "$INSTALL_MODE" != "docker" ]] && [[ "$INSTALL_MODE" != "local" ]]; then
    error "Invalid INSTALL_MODE: '$INSTALL_MODE'. Must be 'docker' or 'local'."
    print_usage
    exit 1
fi

# Validate SKIP_PREREQS
if [[ "$SKIP_PREREQS" != "true" ]] && [[ "$SKIP_PREREQS" != "false" ]]; then
    error "Invalid SKIP_PREREQS: '$SKIP_PREREQS'. Must be 'true' or 'false'."
    print_usage
    exit 1
fi

# Check if command exists
command_exists() {
    command -v "$1" &> /dev/null
}

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

if [ ! -f "package.json" ]; then
    error "package.json not found. Please run this script from the talawa-api repository root."
    exit 1
fi

# Total steps for progress tracking
TOTAL_STEPS=8
CURRENT_STEP=0

##############################################################################
# Step 1: Install Homebrew
##############################################################################
: $((CURRENT_STEP++))
step $CURRENT_STEP $TOTAL_STEPS "Checking Homebrew installation..."

if command_exists brew; then
    success "Homebrew is already installed"
else
    if [ "$SKIP_PREREQS" = "true" ]; then
        error "Homebrew is required but --skip-prereqs was specified"
        exit 1
    fi
    
    info "Installing Homebrew..."
    # Security Note: This uses Homebrew's official installer over HTTPS.
    # Users can review the script first at: https://brew.sh or
    # https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh
    /bin/bash -c "$(curl -fsSL --connect-timeout 30 --max-time 300 https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH for Apple Silicon Macs
    if [ -f /opt/homebrew/bin/brew ]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    # Add Homebrew to PATH for Intel Macs
    elif [ -f /usr/local/bin/brew ]; then
        eval "$(/usr/local/bin/brew shellenv)"
    fi
    
    success "Homebrew installed successfully"
fi

##############################################################################
# Step 2: Install system dependencies
##############################################################################
: $((CURRENT_STEP++))
step $CURRENT_STEP $TOTAL_STEPS "Installing system dependencies..."

if [ "$SKIP_PREREQS" = "true" ]; then
    warn "Skipping prerequisite installation (--skip-prereqs)"
else
    info "Installing git, jq, curl..."
    if brew install git jq curl; then
        success "System dependencies installed"
    else
        warn "Some packages may have failed to install. Continuing anyway..."
    fi
fi

##############################################################################
# Step 3: Install Docker (optional)
##############################################################################
: $((CURRENT_STEP++))
step $CURRENT_STEP $TOTAL_STEPS "Checking Docker installation..."

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
        info "Installing Docker Desktop..."
        brew install --cask docker
        
        warn "Docker Desktop installed. Please launch it from Applications and complete the setup."
        warn "You may need to restart this script after Docker is running."
    fi
else
    info "Local installation mode - skipping Docker setup"
fi

##############################################################################
# Step 4: Install fnm (Fast Node Manager)
##############################################################################
: $((CURRENT_STEP++))
step $CURRENT_STEP $TOTAL_STEPS "Setting up Node.js version manager (fnm)..."

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
step $CURRENT_STEP $TOTAL_STEPS "Reading configuration from package.json..."

# Parse Node.js version from package.json
NODE_VERSION=$(jq -r '.engines.node // "lts"' package.json)
info "Node.js version from package.json: \"$NODE_VERSION\""

# Clean version string (remove >=, ^, ~, and other operators)
# First try to extract full semver (e.g., 20.10.0)
CLEAN_NODE_VERSION=$(echo "$NODE_VERSION" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || true)

# If no full version found, try to extract major.minor version (e.g., 20.10)
if [ -z "$CLEAN_NODE_VERSION" ]; then
    CLEAN_NODE_VERSION=$(echo "$NODE_VERSION" | grep -oE '[0-9]+\.[0-9]+' | head -1 || true)
fi

# If no major.minor version found, try to extract major version (e.g., 20)
if [ -z "$CLEAN_NODE_VERSION" ]; then
    CLEAN_NODE_VERSION=$(echo "$NODE_VERSION" | grep -oE '[0-9]+' | head -1 || true)
fi

# If version is 'lts' or 'latest', keep it as-is
if [ "$NODE_VERSION" = "lts" ] || [ "$NODE_VERSION" = "latest" ]; then
    CLEAN_NODE_VERSION="$NODE_VERSION"
fi

# Validate we got a usable version
if [ -z "$CLEAN_NODE_VERSION" ]; then
    error "Could not parse Node.js version from package.json: '$NODE_VERSION'"
    error ""
    error "Expected formats:"
    error "  - Semver with operator: '>=20.10.0' or '~20.10.0'"
    error "  - Semver: '20.10.0'"
    error "  - Major version: '20'"
    error "  - Aliases: 'lts' or 'latest'"
    error ""
    error "Current value in package.json engines.node: '$NODE_VERSION'"
    error "Please verify package.json is correctly formatted"
    exit 1
fi

info "Parsed Node.js version: $CLEAN_NODE_VERSION"

# Parse pnpm version from package.json
# First try packageManager field (preferred)
PNPM_FULL=$(jq -r '.packageManager // ""' package.json)
if [[ "$PNPM_FULL" == pnpm@* ]]; then
    PNPM_VERSION="${PNPM_FULL#pnpm@}"
    PNPM_VERSION="${PNPM_VERSION%%+*}"  # Remove hash if present
    info "pnpm version from package.json packageManager: \"$PNPM_VERSION\""
else
    # Fallback to engines.pnpm field
    PNPM_VERSION=$(jq -r '.engines.pnpm // "latest"' package.json)
    info "pnpm version from package.json engines.pnpm: \"$PNPM_VERSION\""
fi

# Accept specific versions (e.g., 9.1.0) or aliases (latest)
if [ "$PNPM_VERSION" = "latest" ]; then
    CLEAN_PNPM_VERSION="latest"
else
    # Try to extract version number
    CLEAN_PNPM_VERSION=$(echo "$PNPM_VERSION" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || true)
    
    # If no full version, try major.minor
    if [ -z "$CLEAN_PNPM_VERSION" ]; then
        CLEAN_PNPM_VERSION=$(echo "$PNPM_VERSION" | grep -oE '[0-9]+\.[0-9]+' | head -1 || true)
    fi
    
    # If still no version, try major only
    if [ -z "$CLEAN_PNPM_VERSION" ]; then
        CLEAN_PNPM_VERSION=$(echo "$PNPM_VERSION" | grep -oE '[0-9]+' | head -1 || true)
    fi
    
    # Validate we got something
    if [ -z "$CLEAN_PNPM_VERSION" ]; then
        error "Could not parse pnpm version from package.json: '$PNPM_VERSION'"
        error ""
        error "Expected formats:"
        error "  - Semver: '9.1.0' or '9.1'"
        error "  - Major version: '9'"
        error "  - Alias: 'latest'"
        error ""
        error "Current value in package.json: '$PNPM_VERSION'"
        error "Please verify package.json is correctly formatted"
        exit 1
    fi
fi

info "Using pnpm version: $CLEAN_PNPM_VERSION"

##############################################################################
# Step 6: Install Node.js
##############################################################################
: $((CURRENT_STEP++))
step $CURRENT_STEP $TOTAL_STEPS "Installing Node.js v$CLEAN_NODE_VERSION..."

if [ "$CLEAN_NODE_VERSION" = "lts" ]; then
    info "Installing latest LTS version of Node.js..."
    if ! fnm install --lts; then
        error "Failed to install LTS version of Node.js"
        exit 1
    fi
    if ! fnm use lts-latest; then
        error "Failed to activate LTS version of Node.js"
        exit 1
    fi
    fnm default "$(fnm current)" || echo "Warning: Failed to set LTS as default Node.js version. Current session has correct version but future shells may not." >&2
elif [ "$CLEAN_NODE_VERSION" = "latest" ]; then
    info "Installing latest version of Node.js..."
    if ! fnm install --latest; then
        error "Failed to install latest version of Node.js"
        exit 1
    fi
    if ! fnm use latest; then
        error "Failed to activate latest version of Node.js"
        exit 1
    fi
    fnm default "$(fnm current)" || echo "Warning: Failed to set latest as default Node.js version. Current session has correct version but future shells may not." >&2
else
    if ! fnm install "$CLEAN_NODE_VERSION"; then
        error "Failed to install Node.js v$CLEAN_NODE_VERSION"
        exit 1
    fi
    if ! fnm use "$CLEAN_NODE_VERSION"; then
        error "Failed to activate Node.js v$CLEAN_NODE_VERSION"
        exit 1
    fi
    fnm default "$(fnm current)" || echo "Warning: Failed to set Node.js v$CLEAN_NODE_VERSION as default. Current session has correct version but future shells may not." >&2
fi

# Verify Node.js is available
if ! command_exists node; then
    error "Node.js installation succeeded but node command not found. You may need to restart your shell."
    exit 1
fi

success "Node.js installed: $(node --version)"

##############################################################################
# Step 7: Install pnpm
##############################################################################
: $((CURRENT_STEP++))
step $CURRENT_STEP $TOTAL_STEPS "Installing pnpm v$CLEAN_PNPM_VERSION..."

if command_exists pnpm; then
    CURRENT_PNPM=$(pnpm --version)
    
    # Normalize current version to same precision as target
    CURRENT_PNPM_NORMALIZED="$CURRENT_PNPM"
    if [[ "$CLEAN_PNPM_VERSION" =~ ^[0-9]+$ ]]; then
        # Target is major-only, extract major from current
        CURRENT_PNPM_NORMALIZED=$(echo "$CURRENT_PNPM" | grep -oE '^[0-9]+' || echo "$CURRENT_PNPM")
    elif [[ "$CLEAN_PNPM_VERSION" =~ ^[0-9]+\.[0-9]+$ ]]; then
        # Target is major.minor, extract major.minor from current
        CURRENT_PNPM_NORMALIZED=$(echo "$CURRENT_PNPM" | grep -oE '^[0-9]+\.[0-9]+' || echo "$CURRENT_PNPM")
    fi

    # Skip version comparison if target is "latest" - always update to ensure we have latest
    if [ "$CLEAN_PNPM_VERSION" = "latest" ]; then
        info "Updating pnpm to latest version..."
        npm install -g "pnpm@latest"
    elif [ "$CURRENT_PNPM_NORMALIZED" = "$CLEAN_PNPM_VERSION" ]; then
        success "pnpm is already installed: v$CURRENT_PNPM"
    else
        info "Updating pnpm from v$CURRENT_PNPM to v$CLEAN_PNPM_VERSION..."
        npm install -g "pnpm@$CLEAN_PNPM_VERSION"
    fi
else
    info "Installing pnpm..."
    npm install -g "pnpm@$CLEAN_PNPM_VERSION"
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
step $CURRENT_STEP $TOTAL_STEPS "Installing project dependencies..."

# Run pnpm install non-interactively (CI=true prevents interactive prompts)
CI=true pnpm install

success "Project dependencies installed"

##############################################################################
# Complete
##############################################################################
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Installation completed successfully!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
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
