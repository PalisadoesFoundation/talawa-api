#!/bin/bash

##############################################################################
# Talawa API - Linux (Ubuntu/Debian) Installation Script
# 
# This script installs all prerequisites for running Talawa API:
# - Git, curl, jq, unzip (system utilities)
# - Docker (optional, based on install mode)
# - fnm (Fast Node Manager)
# - Node.js (version from package.json)
# - pnpm (version from package.json)
##############################################################################

set -e

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

# Check if command exists
command_exists() {
    command -v "$1" &> /dev/null
}

##############################################################################
# Safe jq parsing helper function
# 
# This function provides robust jq parsing with:
# - Verification that jq is installed
# - Error handling for malformed JSON
# - Null/empty result handling with defaults
# - Clear error messages for debugging
##############################################################################
parse_package_json() {
    local jq_query="$1"
    local default_value="$2"
    local field_name="$3"
    local is_required="${4:-false}"
    
    # Verify jq is available before attempting to parse
    if ! command_exists jq; then
        error "jq is required but not installed"
        echo ""
        info "jq is a lightweight JSON processor needed to parse package.json"
        echo ""
        info "Install jq using your package manager:"
        echo "  • Ubuntu/Debian:  sudo apt-get install jq"
        echo "  • Fedora/RHEL:    sudo dnf install jq"
        echo "  • Arch/Manjaro:   sudo pacman -S jq"
        echo "  • macOS:          brew install jq"
        echo ""
        info "After installing jq, re-run this script"
        exit 1
    fi
    
    # Verify package.json exists and is readable
    if [ ! -r "package.json" ]; then
        error "Cannot read package.json file"
        echo ""
        info "Ensure package.json exists and is readable in the current directory"
        exit 1
    fi
    
    local result
    local jq_exit_code
    
    # Attempt to parse with jq, capturing both output and exit code
    result=$(jq -r "$jq_query" package.json 2>&1)
    jq_exit_code=$?
    
    # Check if jq command failed (malformed JSON or invalid query)
    if [ $jq_exit_code -ne 0 ]; then
        error "Failed to parse $field_name from package.json"
        echo ""
        info "jq error: $result"
        echo ""
        info "Common causes:"
        echo "  • Malformed JSON syntax in package.json"
        echo "  • Invalid jq query expression"
        echo "  • Corrupted package.json file"
        echo ""
        info "Troubleshooting steps:"
        echo "  1. Validate package.json syntax:"
        echo "     jq . package.json"
        echo ""
        echo "  2. Check for common JSON errors:"
        echo "     • Missing commas between properties"
        echo "     • Trailing commas after last property"
        echo "     • Unmatched brackets or braces"
        echo "     • Invalid escape sequences in strings"
        echo ""
        echo "  3. If package.json is corrupted, restore it:"
        echo "     git checkout package.json"
        echo ""
        info "Documentation: https://github.com/PalisadoesFoundation/talawa-api/blob/develop/INSTALLATION.md"
        exit 1
    fi
    
    # Check for null or empty results
    if [ -z "$result" ] || [ "$result" = "null" ]; then
        if [ "$is_required" = "true" ]; then
            error "$field_name not found in package.json (required field)"
            echo ""
            info "The field '$field_name' is required but was not found or is null"
            echo ""
            info "Expected location in package.json: $jq_query"
            echo ""
            info "Troubleshooting steps:"
            echo "  1. Check if the field exists in package.json:"
            echo "     jq '$jq_query' package.json"
            echo ""
            echo "  2. Ensure you have the latest version of the repository:"
            echo "     git pull origin develop"
            echo ""
            info "Report issues: https://github.com/PalisadoesFoundation/talawa-api/issues"
            exit 1
        fi
        
        # Use default value if provided
        if [ -n "$default_value" ]; then
            echo "$default_value"
            return 0
        fi
        
        # Return empty string if no default and not required
        echo ""
        return 0
    fi
    
    # Return the successfully parsed result
    echo "$result"
}

# Get the repository root directory
get_repo_root() {
    local script_dir
    local repo_root
    script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    # Navigate up from scripts/install/linux to repo root
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

# Detect Linux distribution
detect_distro() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        echo "$ID"
    elif [ -f /etc/debian_version ]; then
        echo "debian"
    elif [ -f /etc/redhat-release ]; then
        echo "rhel"
    else
        echo "unknown"
    fi
}

DISTRO=$(detect_distro)
info "Detected Linux distribution: $DISTRO"

# Total steps for progress tracking
TOTAL_STEPS=7
CURRENT_STEP=0

##############################################################################
# Step 1: Install system dependencies
##############################################################################
: $((CURRENT_STEP++))
step $CURRENT_STEP $TOTAL_STEPS "Installing system dependencies..."

if [ "$SKIP_PREREQS" = "true" ]; then
    warn "Skipping prerequisite installation (--skip-prereqs)"
else
    INSTALLED_PREREQS=false
    case $DISTRO in
        ubuntu|debian|linuxmint|pop)
            info "Updating package lists..."
            sudo apt-get update -qq
            
            info "Installing git, curl, jq, unzip..."
            sudo apt-get install -y -qq git curl jq unzip
            INSTALLED_PREREQS=true
            ;;
        fedora|rhel|centos)
            info "Installing git, curl, jq, unzip..."
            sudo dnf install -y -q git curl jq unzip
            INSTALLED_PREREQS=true
            ;;
        arch|manjaro)
            info "Installing git, curl, jq, unzip..."
            sudo pacman -S --noconfirm --quiet git curl jq unzip
            INSTALLED_PREREQS=true
            ;;
        *)
            warn "Unknown distribution. Please install git, curl, jq, unzip manually."
            ;;
    esac
    
    if [ "$INSTALLED_PREREQS" = "true" ]; then
        success "System dependencies installed"
    fi
fi

##############################################################################
# Step 2: Install Docker (optional)
##############################################################################
: $((CURRENT_STEP++))
step $CURRENT_STEP $TOTAL_STEPS "Checking Docker installation..."

if [ "$INSTALL_MODE" = "docker" ]; then
    if command_exists docker; then
        success "Docker is already installed: $(docker --version)"
    elif [ "$SKIP_PREREQS" = "true" ]; then
        warn "Skipping Docker installation (--skip-prereqs)"
    else
        info "Installing Docker..."
        # Security Note: This uses Docker's official convenience script over HTTPS.
        # The script is from a trusted source (get.docker.com) but piping to shell
        # carries inherent risk. Users can review the script first by visiting:
        # https://get.docker.com or using: curl -fsSL https://get.docker.com | less
        curl -fsSL --connect-timeout 30 --max-time 300 https://get.docker.com | sh
        
        info "Adding current user to docker group..."
        sudo usermod -aG docker "$USER"
        
        warn "Docker group added. You may need to log out and back in for group changes to take effect."
        success "Docker installed successfully"
    fi
    
    # Check docker-compose
    if command_exists docker-compose || docker compose version &> /dev/null; then
        success "Docker Compose is available"
    else
        warn "Docker Compose not found. It may be included with Docker Desktop or installed separately."
    fi
    
    # Verify Docker is running
    if command_exists docker; then
        if ! docker info >/dev/null 2>&1; then
            warn "Docker is installed but not running."
            info "Start Docker with: sudo systemctl start docker"
            info "Enable on boot with: sudo systemctl enable docker"
        else
            success "Docker is running"
        fi
    fi
else
    info "Local installation mode - skipping Docker setup"
fi

##############################################################################
# Step 3: Install fnm (Fast Node Manager)
##############################################################################
: $((CURRENT_STEP++))
step $CURRENT_STEP $TOTAL_STEPS "Setting up Node.js version manager (fnm)..."

if command_exists fnm; then
    success "fnm is already installed"
    eval "$(fnm env)"
else
    info "Installing fnm..."
    # Security Note: This uses fnm's official installer over HTTPS.
    # Users can review the script first at: https://fnm.vercel.app/install
    curl -fsSL --connect-timeout 30 --max-time 120 https://fnm.vercel.app/install | bash -s -- --skip-shell
    
    # Set up fnm for current session
    export PATH="$HOME/.local/share/fnm:$PATH"
    eval "$(fnm env)"
    
    success "fnm installed successfully"
fi

##############################################################################
# Step 4: Read versions from package.json
##############################################################################
: $((CURRENT_STEP++))
step $CURRENT_STEP $TOTAL_STEPS "Reading configuration from package.json..."

# Extract Node.js version using safe parsing
# The 'lts' default is used if engines.node is not specified
NODE_VERSION=$(parse_package_json '.engines.node' "lts" "Node.js version (engines.node)" "false")

# Validate that we got a usable Node.js version
if [ -z "$NODE_VERSION" ]; then
    warn "No Node.js version specified in package.json, using LTS"
    NODE_VERSION="lts"
fi

# Clean version string (handle >=, ^, etc.)
if [[ "$NODE_VERSION" =~ ^(\^|>=|~) ]]; then
    # Extract full semantic version (e.g., ">=18.0.0" -> "18.0.0")
    CLEAN_NODE_VERSION=$(echo "$NODE_VERSION" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    # Fallback to major version only if full semver not found
    if [ -z "$CLEAN_NODE_VERSION" ]; then
        CLEAN_NODE_VERSION=$(echo "$NODE_VERSION" | grep -oE '[0-9]+' | head -1)
    fi
else
    CLEAN_NODE_VERSION="$NODE_VERSION"
fi

# Final validation of cleaned Node.js version
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
elif [ -n "$PNPM_FULL" ] && [ "$PNPM_FULL" != "null" ]; then
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
# Step 5: Install Node.js
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
# Step 6: Install pnpm
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
# Step 7: Install project dependencies
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
warn "NOTE: To make fnm available in new terminal sessions, add this to your ~/.bashrc or ~/.zshrc:"
echo "  export PATH=\"\$HOME/.local/share/fnm:\$PATH\""
echo "  eval \"\$(fnm env)\""
echo ""
info "Then restart your terminal or run: source ~/.bashrc (or ~/.zshrc)"
echo ""
info "To complete setup, run:"
echo "  pnpm run setup"
echo ""

