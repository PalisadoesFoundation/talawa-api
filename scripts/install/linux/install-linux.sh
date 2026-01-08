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

set -euo pipefail

# Installation log file for error tracking
readonly INSTALLATION_LOG="/tmp/talawa-install-$$.log"

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

# Log error to installation log file
log_error() {
    local message="$1"
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] ERROR: $message" >> "$INSTALLATION_LOG"
}

# Check if command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Check Docker Compose availability and log errors
# Returns: 0 if available, 1 if not available
check_docker_compose() {
    local output
    local exit_code
    
    # Check docker compose plugin
    output=$(docker compose version 2>&1) && exit_code=$? || exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        return 0
    else
        log_error "Docker Compose check failed (exit code: $exit_code): $output"
        return 1
    fi
}

# Check if Docker daemon is running and log errors
# Returns: 0 if running, 1 if not running
check_docker_running() {
    local output
    local exit_code
    
    output=$(docker info 2>&1) && exit_code=$? || exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        return 0
    else
        log_error "Docker daemon check failed (exit code: $exit_code): $output"
        return 1
    fi
}

# Check if apt cache was updated recently (within the last hour)
# Returns: 0 if cache is fresh, 1 if stale or missing
apt_cache_is_fresh() {
    local apt_lists_dir="/var/lib/apt/lists"
    local cache_max_age=3600  # 1 hour (in seconds)
    
    if [ -d "$apt_lists_dir" ]; then
        # Find the most recently modified file in apt lists directory
        local last_update
        last_update=$(find "$apt_lists_dir" -type f -printf '%T@\n' 2>/dev/null | sort -n | tail -1 | cut -d. -f1)
        # If no files found or find failed, cache is stale
        if [ -z "$last_update" ]; then
            return 1
        fi
        local current_time
        current_time=$(date +%s)
        local cache_age=$((current_time - last_update))
        
        if [ $cache_age -lt $cache_max_age ]; then
            return 0  # Cache is fresh
        fi
    fi
    return 1  # Cache is stale or doesn't exist
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
            if apt_cache_is_fresh; then
                info "Package lists are up-to-date (updated within the last hour)"
            else
                info "Updating package lists..."
                sudo apt-get update -qq
            fi
            
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
    if command_exists docker-compose; then
        success "Docker Compose is available (standalone)"
    elif check_docker_compose; then
        success "Docker Compose is available (plugin)"
    else
        warn "Docker Compose not found. It may be included with Docker Desktop or installed separately."
        warn "Check $INSTALLATION_LOG for details."
    fi
    
    # Verify Docker is running
    if command_exists docker; then
        if check_docker_running; then
            success "Docker is running"
        else
            warn "Docker is installed but not running."
            warn "Check $INSTALLATION_LOG for details."
            info "Start Docker with: sudo systemctl start docker"
            info "Enable on boot with: sudo systemctl enable docker"
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

# Extract Node.js version
NODE_VERSION=$(jq -r '.engines.node // "lts"' package.json)
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

# Extract pnpm version
PNPM_FULL=$(jq -r '.packageManager // ""' package.json)
if [[ "$PNPM_FULL" == pnpm@* ]]; then
    PNPM_VERSION="${PNPM_FULL#pnpm@}"
    PNPM_VERSION="${PNPM_VERSION%%+*}"  # Remove hash if present
else
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
    if [ "$PNPM_VERSION" = "latest" ]; then
        # Query npm registry for actual latest version
        LATEST_PNPM=$(npm view pnpm version 2>/dev/null) || LATEST_PNPM=""
        if [ -n "$LATEST_PNPM" ] && [ "$CURRENT_PNPM" = "$LATEST_PNPM" ]; then
            success "pnpm is already at latest version: v$CURRENT_PNPM"
        elif [ -n "$LATEST_PNPM" ]; then
            info "Updating pnpm from v$CURRENT_PNPM to latest (v$LATEST_PNPM)..."
            npm install -g "pnpm@latest"
        else
            warn "Could not determine latest pnpm version from npm registry"
            info "Updating pnpm to latest version..."
            npm install -g "pnpm@latest"
        fi
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

# Make pnpm install idempotent by tracking lockfile hash
LOCKFILE_HASH_CACHE="node_modules/.pnpm-lock-hash"
NEEDS_INSTALL=true

if [ -f "pnpm-lock.yaml" ]; then
    CURRENT_LOCKFILE_HASH=$(sha256sum pnpm-lock.yaml | cut -d ' ' -f 1)
    
    if [ -d "node_modules" ] && [ -f "$LOCKFILE_HASH_CACHE" ]; then
        CACHED_HASH=$(cat "$LOCKFILE_HASH_CACHE" 2>/dev/null) || CACHED_HASH=""
        if [ "$CURRENT_LOCKFILE_HASH" = "$CACHED_HASH" ]; then
            NEEDS_INSTALL=false
            success "Dependencies already up-to-date (lockfile unchanged)"
        fi
    fi
    
    if [ "$NEEDS_INSTALL" = true ]; then
        info "Installing dependencies..."
        pnpm install
        # Cache the lockfile hash after successful install
        echo "$CURRENT_LOCKFILE_HASH" > "$LOCKFILE_HASH_CACHE"
        success "Project dependencies installed"
    fi
else
    # No lockfile exists, run install to generate it
    info "No pnpm-lock.yaml found, running fresh install..."
    pnpm install
    # Cache the new lockfile hash
    if [ -f "pnpm-lock.yaml" ]; then
        sha256sum pnpm-lock.yaml | cut -d ' ' -f 1 > "$LOCKFILE_HASH_CACHE"
    fi
    success "Project dependencies installed"
fi

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

