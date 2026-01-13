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
# Source common validation functions
##############################################################################
COMMON_VALIDATION_LIB="$(dirname "${BASH_SOURCE[0]}")/../common/validation.sh"
if [ ! -f "$COMMON_VALIDATION_LIB" ]; then
    error "Common validation library not found: $COMMON_VALIDATION_LIB"
    error "Please ensure the installation directory structure is intact."
    exit 1
fi
# shellcheck source=../common/validation.sh
source "$COMMON_VALIDATION_LIB"

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

# Extract Node.js version using safe parsing
# The 'lts' default is used if engines.node is not specified
NODE_VERSION=$(parse_package_json '.engines.node' "lts" "Node.js version (engines.node)" "false")

# SECURITY: Validate raw NODE_VERSION before any processing
# This prevents command injection via malicious package.json
if ! validate_version_string "$NODE_VERSION" "Node.js version (engines.node)"; then
    error "❌ Security validation failed for Node.js version"
    echo ""
    info "The value in package.json engines.node field contains invalid characters."
    echo ""
    info "Current value: '$NODE_VERSION'"
    echo ""
    info "This could indicate:"
    echo "  • Corrupted package.json file"
    echo "  • Potentially malicious version string"
    echo "  • Typo or formatting error"
    echo ""
    info "Troubleshooting steps:"
    echo "  1. Check the engines.node field in package.json:"
    echo "     jq '.engines.node' package.json"
    echo ""
    echo "  2. Restore package.json if corrupted:"
    echo "     git checkout package.json"
    echo ""
    echo "  3. Ensure version follows semver format (e.g., 18.0.0, ^18.0.0)"
    echo ""
    info "Report issues: https://github.com/PalisadoesFoundation/talawa-api/issues"
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
    error "❌ Security validation failed for cleaned Node.js version: '$CLEAN_NODE_VERSION'"
    echo ""
    info "The cleaned version string contains invalid characters."
    info "This should not happen with valid package.json values."
    echo ""
    info "Troubleshooting steps:"
    echo "  1. Restore package.json: git checkout package.json"
    echo "  2. Re-run this script"
    echo ""
    info "Report issues: https://github.com/PalisadoesFoundation/talawa-api/issues"
    exit 1
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
        error "❌ Security validation failed for pnpm version"
        echo ""
        info "The pnpm version in package.json packageManager field contains invalid characters."
        echo ""
        info "Current value: '$PNPM_FULL'"
        info "Extracted version: '$PNPM_VERSION'"
        echo ""
        info "This could indicate:"
        echo "  • Corrupted package.json file"
        echo "  • Potentially malicious version string"
        echo "  • Typo or formatting error"
        echo ""
        info "Troubleshooting steps:"
        echo "  1. Check the packageManager field in package.json:"
        echo "     jq '.packageManager' package.json"
        echo ""
        echo "  2. Restore package.json if corrupted:"
        echo "     git checkout package.json"
        echo ""
        echo "  3. Ensure version follows format: pnpm@X.Y.Z (e.g., pnpm@10.2.1)"
        echo ""
        info "Report issues: https://github.com/PalisadoesFoundation/talawa-api/issues"
        exit 1
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
step $CURRENT_STEP $TOTAL_STEPS "Installing Node.js v$CLEAN_NODE_VERSION..."

if [ "$CLEAN_NODE_VERSION" = "lts" ]; then
    info "Installing latest LTS version of Node.js..."
    # Install LTS and capture output to determine version
    if ! OUTPUT=$(fnm install --lts 2>&1); then
        echo "$OUTPUT"
        error "Failed to install LTS version of Node.js"
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
        error "Failed to activate latest version of Node.js"
        exit 1
    fi
    VERSION="$(fnm current | awk '{sub(/^v/, "", $1); print $1}')"
    fnm default "$VERSION" || echo "Warning: Failed to set latest as default Node.js version. Current session has correct version but future shells may not." >&2
else
    if ! fnm install "$CLEAN_NODE_VERSION"; then
        error "Failed to install Node.js v$CLEAN_NODE_VERSION"
        exit 1
    fi
    if ! fnm use "$CLEAN_NODE_VERSION"; then
        error "Failed to activate Node.js v$CLEAN_NODE_VERSION"
        exit 1
    fi
    fnm default "$(fnm current | awk '{sub(/^v/, "", $1); print $1}')" || echo "Warning: Failed to set Node.js v$CLEAN_NODE_VERSION as default. Current session has correct version but future shells may not." >&2
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
step $CURRENT_STEP $TOTAL_STEPS "Installing pnpm v$PNPM_VERSION..."

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
        if ! npm install -g "pnpm@latest"; then
            error "Failed to update pnpm to latest version"
            exit 1
        fi
    elif [ "$CURRENT_PNPM_NORMALIZED" = "$PNPM_VERSION" ]; then
        success "pnpm is already installed: v$CURRENT_PNPM"
    else
        info "Updating pnpm from v$CURRENT_PNPM to v$PNPM_VERSION..."
        if ! npm install -g "pnpm@$PNPM_VERSION"; then
            error "Failed to update pnpm to v$PNPM_VERSION"
            exit 1
        fi
    fi
else
    info "Installing pnpm..."
    if ! npm install -g "pnpm@$PNPM_VERSION"; then
        error "Failed to install pnpm v$PNPM_VERSION"
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
step $CURRENT_STEP $TOTAL_STEPS "Installing project dependencies..."

# Run pnpm install non-interactively (only set CI=true if in CI to allow local interaction if needed)
if [ "${CI:-}" = "true" ] || [ -n "${GITHUB_ACTIONS:-}" ]; then
    CI=true pnpm install
else
    pnpm install
fi

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
