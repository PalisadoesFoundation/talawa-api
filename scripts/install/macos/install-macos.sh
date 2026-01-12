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
# Validate version strings to prevent command injection
# 
# This function validates version strings from package.json to prevent:
# - Command injection via malicious version strings (e.g., "18.0.0; rm -rf /")
# - Word splitting from spaces in version strings
# - Glob expansion from special characters
#
# Allowed characters: alphanumeric, dots, hyphens, carets, tildes, equals,
#                     greater than, less than, forward slash (covers semver patterns)
#
# Test cases (for regression testing):
#   Should PASS: "18.0.0", "^18.0.0", ">=18.0.0", "~18.0.0", "lts", "lts/latest"
#   Should FAIL: "18.0.0; rm -rf /", "18.0.0$(whoami)", "18.0.0 && malicious"
#
# Usage: validate_version_string "version" "field_name"
# Returns: 0 if valid, 1 if invalid
##############################################################################
validate_version_string() {
    local version="$1"
    local field_name="$2"
    
    # Check if version is empty or null
    if [ -z "$version" ] || [ "$version" = "null" ]; then
        error "Invalid $field_name: version string is empty or null"
        return 1
    fi
    
    # Allow only: alphanumeric, dots, hyphens, carets, tildes, equals, greater/less than, forward slash
    # This covers semver patterns like: 18.0.0, ^18.0.0, ~18.0.0, >=18.0.0, lts, lts/latest
    # Pattern stored in variable to avoid shell interpretation issues
    local pattern='^[a-zA-Z0-9./~^=<>-]+$'
    if [[ ! "$version" =~ $pattern ]]; then
        error "Invalid $field_name: '$version'"
        echo ""
        info "Version strings must contain only:"
        echo "  • Letters (a-z, A-Z)"
        echo "  • Numbers (0-9)"
        echo "  • Dots (.)"
        echo "  • Hyphens (-)"
        echo "  • Version operators (^, ~, =, >, <)"
        echo "  • Forward slash (/) for lts/latest patterns"
        echo ""
        info "Rejected characters found: $(echo "$version" | tr -d 'a-zA-Z0-9./~^=<>-')"
        echo ""
        info "Security note: Special characters, spaces, semicolons, and shell"
        info "metacharacters are not allowed to prevent command injection."
        return 1
    fi
    
    # Additional check: ensure it looks like a version (has at least one number)
    # Exception: allow 'lts' or 'latest' as valid version identifiers
    if [[ ! "$version" =~ [0-9] ]] && [[ ! "$version" =~ ^(lts|latest|lts/latest|lts/[a-zA-Z]+)$ ]]; then
        error "Invalid $field_name: '$version' doesn't appear to be a valid version"
        echo ""
        info "Expected formats:"
        echo "  • Exact version:  \"18.0.0\" or \"23.7.0\""
        echo "  • Range:          \">=18.0.0\""
        echo "  • Caret:          \"^18.0.0\""
        echo "  • Tilde:          \"~18.0.0\""
        echo "  • LTS:            \"lts\" or \"lts/latest\""
        return 1
    fi
    
    return 0
}

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

# Extract Node.js version
NODE_VERSION=$(jq -r '.engines.node // "lts"' package.json)

# Validate Node.js version string for security
if ! validate_version_string "$NODE_VERSION" "Node.js version (engines.node)"; then
    exit 1
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

# Extract pnpm version
PNPM_FULL=$(jq -r '.packageManager // ""' package.json)
if [[ "$PNPM_FULL" == pnpm@* ]]; then
    PNPM_VERSION="${PNPM_FULL#pnpm@}"
    PNPM_VERSION="${PNPM_VERSION%%+*}"  # Remove hash if present
else
    PNPM_VERSION="latest"
fi

# Validate pnpm version string for security
if ! validate_version_string "$PNPM_VERSION" "pnpm version (packageManager)"; then
    exit 1
fi

info "Target Node.js version: $CLEAN_NODE_VERSION"
info "Target pnpm version: $PNPM_VERSION"

##############################################################################
# Step 6: Install Node.js
##############################################################################
: $((CURRENT_STEP++))
step $CURRENT_STEP $TOTAL_STEPS "Installing Node.js v$CLEAN_NODE_VERSION..."

fnm install "$CLEAN_NODE_VERSION"
if ! fnm use "$CLEAN_NODE_VERSION"; then
    error "Failed to activate Node.js v$CLEAN_NODE_VERSION"
    exit 1
fi
fnm default "$CLEAN_NODE_VERSION"

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
step $CURRENT_STEP $TOTAL_STEPS "Installing pnpm v$PNPM_VERSION..."

if command_exists pnpm; then
    CURRENT_PNPM=$(pnpm --version)
    # Skip version comparison if target is "latest" - always update to ensure we have latest
    if [ "$PNPM_VERSION" = "latest" ]; then
        info "Updating pnpm to latest version..."
        npm install -g "pnpm@latest"
    elif [ "$CURRENT_PNPM" = "$PNPM_VERSION" ]; then
        success "pnpm is already installed: v$CURRENT_PNPM"
    else
        info "Updating pnpm from v$CURRENT_PNPM to v$PNPM_VERSION..."
        npm install -g "pnpm@$PNPM_VERSION"
    fi
else
    info "Installing pnpm..."
    npm install -g "pnpm@$PNPM_VERSION"
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

pnpm install

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
