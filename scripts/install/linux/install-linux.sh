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

# Arguments
INSTALL_MODE="${1:-docker}"
SKIP_PREREQS="${2:-false}"

# Non-interactive mode: skip confirmation prompts
# Set CI=true or AUTO_YES=true environment variable, or run with stdin not a terminal
AUTO_YES="${AUTO_YES:-${CI:-false}}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Installation paths
readonly FNM_INSTALL_DIR="${FNM_DIR:-$HOME/.local/share/fnm}"
readonly FNM_BIN_DIR="$FNM_INSTALL_DIR"
readonly INSTALLATION_LOG="/tmp/talawa-install-$$.log"

# Version requirements
readonly MIN_NODE_MAJOR_VERSION=18 #placeholder for future references
readonly MIN_DISK_SPACE_GB=2 #placeholder for future references

# Timeouts
readonly CURL_CONNECT_TIMEOUT=30
readonly CURL_MAX_TIME_DOCKER=300
readonly CURL_MAX_TIME_FNM=120
readonly MAX_RETRY_ATTEMPTS=3 # placeholder for future retry logic

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

##############################################################################
# Pre-flight Checks: Validate repository and environment
##############################################################################

# Minimum required disk space in KB (2GB)
readonly MIN_DISK_SPACE_KB=2097152

validate_repository() {
    # Verify package.json exists
    if [ ! -f "package.json" ]; then
        error "package.json not found. Please run this script from the talawa-api repository root."
        echo ""
        info "Remediation steps:"
        echo "  1. Clone the repository: git clone https://github.com/PalisadoesFoundation/talawa-api.git"
        echo "  2. Navigate to the repository: cd talawa-api"
        echo "  3. Run this script again"
        exit 1
    fi

    # Verify this is the talawa-api repository
    # Verify jq is available for JSON parsing
    if ! command_exists jq; then
        error "jq is required but not installed."
        echo ""
        info "jq is a lightweight JSON processor needed to validate package.json"
        echo ""
        info "Install jq using your package manager:"
        echo "  • Ubuntu/Debian:  sudo apt-get install jq"
        echo "  • Fedora/RHEL:    sudo dnf install jq"
        echo "  • Arch/Manjaro:   sudo pacman -S jq"
        echo ""
        info "After installing jq, re-run this script"
        exit 1
    fi
        PACKAGE_NAME=$(jq -r '.name // empty' package.json)



    if [ "$PACKAGE_NAME" != "talawa-api" ]; then
        error "This script must be run from the talawa-api repository."
        echo "  Found package name: '$PACKAGE_NAME'"
        echo "  Expected: 'talawa-api'"
        echo ""
        info "Remediation: Ensure you are in the correct directory and try again."
        exit 1
    fi

    # Check 3: Validate required package.json fields exist
    MISSING_FIELDS=""

    PKG_VERSION=$(jq -r '.version // empty' package.json 2>/dev/null)
    if [ -z "$PKG_VERSION" ]; then
        MISSING_FIELDS="$MISSING_FIELDS version"
    fi


    NODE_ENGINE=$(jq -r '.engines.node // empty' package.json 2>/dev/null)
    if [ -z "$NODE_ENGINE" ]; then
        MISSING_FIELDS="$MISSING_FIELDS engines.node"
    fi

    PKG_MANAGER=$(jq -r '.packageManager // empty' package.json 2>/dev/null)
    if [ -z "$PKG_MANAGER" ]; then
        MISSING_FIELDS="$MISSING_FIELDS packageManager"
    fi

    if [ -n "$MISSING_FIELDS" ]; then
        error "Required fields missing from package.json:$MISSING_FIELDS"
        echo ""
        info "Remediation steps:"
        echo "  1. Ensure you have the latest version of the repository:"
        echo "     git pull origin develop"
        echo "  2. If the issue persists, re-clone the repository:"
        echo "     git clone https://github.com/PalisadoesFoundation/talawa-api.git"
        exit 1
    fi
}

validate_disk_space() {
    # Verify available disk space (minimum 2GB)
    AVAILABLE_SPACE_KB=$(df -k "$REPO_ROOT" | awk 'NR==2 {print $4}')
    if [ -z "$AVAILABLE_SPACE_KB" ]; then
        warn "Could not determine available disk space. Proceeding with installation."
        info "Manually verify at least 2GB is available: df -h $REPO_ROOT"
        return 0
    fi

    if [ "$AVAILABLE_SPACE_KB" -lt "$MIN_DISK_SPACE_KB" ]; then
        AVAILABLE_SPACE_MB=$((AVAILABLE_SPACE_KB / 1024))
        REQUIRED_SPACE_MB=$((MIN_DISK_SPACE_KB / 1024))
        error "Insufficient disk space. Available: ${AVAILABLE_SPACE_MB}MB, Required: ${REQUIRED_SPACE_MB}MB (2GB)"
        echo ""
        info "Remediation steps:"
        echo "  1. Free up disk space by removing unnecessary files"
        echo "  2. Check disk usage: df -h"
        echo "  3. Find large files: du -sh * | sort -rh | head -10"
        exit 1
    fi
}

check_git_repo() {
    # Verify git repository exists
    if [ ! -d ".git" ]; then
        error "This directory is not a git repository."
        echo ""
        info "Remediation steps:"
        echo "  1. Clone the repository properly:"
        echo "     git clone https://github.com/PalisadoesFoundation/talawa-api.git"
        echo "  2. Navigate to the cloned directory: cd talawa-api"
        exit 1
    fi

    # Verify git is functional and check for uncommitted changes
    if command_exists git; then
        # Check if git repository is valid
        if ! git rev-parse --is-inside-work-tree &>/dev/null; then
            error "Invalid git repository. The .git directory may be corrupted."
            info "Remediation: Re-clone the repository from GitHub."
            exit 1
        fi

        # Warn about uncommitted changes (non-blocking)
        if ! git diff-index --quiet HEAD -- 2>/dev/null; then
            warn "You have uncommitted changes in your repository."
            info "Consider committing or stashing your changes before installation."
        fi
    fi
}

validate_repository
validate_disk_space
check_git_repo

success "Repository validation passed: talawa-api"

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
            warn "Unknown distribution: $DISTRO"
            echo ""
            info "This script supports: Ubuntu, Debian, Linux Mint, Pop!_OS, Fedora, RHEL, CentOS, Arch, Manjaro"
            echo ""
            info "Manual installation required. Install the following packages using your package manager:"
            echo "  • git       - Version control system"
            echo "  • curl      - HTTP client for downloads"
            echo "  • jq        - JSON processor"
            echo "  • unzip     - Archive extraction utility"
            echo ""
            info "Example commands for common package managers:"
            echo "  • apt (Debian-based):    sudo apt install git curl jq unzip"
            echo "  • dnf (Fedora/RHEL):     sudo dnf install git curl jq unzip"
            echo "  • pacman (Arch-based):   sudo pacman -S git curl jq unzip"
            echo "  • zypper (openSUSE):     sudo zypper install git curl jq unzip"
            echo ""
            info "After installing dependencies manually, re-run this script with:"
            echo "  ./scripts/install/linux/install-linux.sh --skip-prereqs"
            echo ""
            info "To check your distribution: cat /etc/os-release"
            info "Report unsupported distros: https://github.com/PalisadoesFoundation/talawa-api/issues"
            info "  Include: Output of 'cat /etc/os-release'"
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
        # Security Note: Docker's official convenience script is downloaded to a temporary file
        # for review before execution. This prevents direct pipe-to-shell vulnerabilities.
        docker_installer="$(mktemp /tmp/get-docker.XXXXXX.sh)"
        trap 'rm -f "$docker_installer"' EXIT
        
        info "Downloading Docker installation script from https://get.docker.com..."
        if ! retry_command "$MAX_RETRY_ATTEMPTS" curl -fsSL --connect-timeout "$CURL_CONNECT_TIMEOUT" --max-time "$CURL_MAX_TIME_DOCKER" -o "$docker_installer" https://get.docker.com; then
            error "Failed to download Docker installer after multiple attempts."
            error "Check your internet connection and try again."
            rm -f "$docker_installer"
            exit 1
        fi
        success "Docker installer downloaded to: $docker_installer"
        
        # User confirmation before execution (skip in non-interactive mode)
        if [ "$AUTO_YES" = "true" ] || ! test -t 0; then
            info "Non-interactive mode detected, proceeding with Docker installation..."
        else
            info "You can review the script before installation:"
            info "  less $docker_installer"
            info "  cat $docker_installer"
            echo ""
            read -p "Proceed with Docker installation? (y/N): " -n 1 -r
            echo ""
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                warn "Docker installation cancelled by user."
                rm -f "$docker_installer"
                exit 1
            fi
        fi
        
        info "Executing Docker installer..."
        if ! sh "$docker_installer"; then
            error "Docker installer script failed."
            error "Check the error messages above for details."
            rm -f "$docker_installer"
            exit 1
        fi
        rm -f "$docker_installer"
        trap - EXIT
        
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
    info "Installing fnm (Fast Node Manager)..."
    # Security Note: fnm's official installer is downloaded to a temporary file
    # for review before execution. This prevents direct pipe-to-shell vulnerabilities.
    fnm_installer="$(mktemp /tmp/fnm-install.XXXXXX.sh)"
    trap 'rm -f "$fnm_installer"' EXIT
    
    info "Downloading fnm installation script from https://fnm.vercel.app/install..."
    if ! retry_command "$MAX_RETRY_ATTEMPTS" curl -fsSL --connect-timeout "$CURL_CONNECT_TIMEOUT" --max-time "$CURL_MAX_TIME_FNM" -o "$fnm_installer" https://fnm.vercel.app/install; then
        error "Failed to download fnm installer after multiple attempts."
        error "Check your internet connection and try again."
        rm -f "$fnm_installer"
        exit 1
    fi
    success "fnm installer downloaded to: $fnm_installer"
    
    # User confirmation before execution (skip in non-interactive mode)
    if [ "$AUTO_YES" = "true" ] || ! test -t 0; then
        info "Non-interactive mode detected, proceeding with fnm installation..."
    else
        info "You can review the script before installation:"
        info "  less $fnm_installer"
        info "  cat $fnm_installer"
        echo ""
        read -p "Proceed with fnm installation? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            warn "fnm installation cancelled by user."
            rm -f "$fnm_installer"
            exit 1
        fi
    fi
    
    info "Executing fnm installer..."
    if ! bash "$fnm_installer" --skip-shell; then
        error "fnm installer script failed."
        error "Check the error messages above for details."
        rm -f "$fnm_installer"
        exit 1
    fi
    rm -f "$fnm_installer"
    trap - EXIT
    
    # Set up fnm for current session
    export PATH="$FNM_BIN_DIR:$PATH"
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

# SECURITY: Validate raw NODE_VERSION before any processing
# This prevents command injection via malicious package.json
if ! validate_version_string "$NODE_VERSION" "Node.js version (engines.node)"; then
    handle_version_validation_error "engines.node" "$NODE_VERSION" ".engines.node"
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
# Step 5: Install Node.js
##############################################################################
: $((CURRENT_STEP++))
step $CURRENT_STEP $TOTAL_STEPS "Installing Node.js v$CLEAN_NODE_VERSION..."

fnm install "$CLEAN_NODE_VERSION"
if ! fnm use "$CLEAN_NODE_VERSION"; then
    error "Failed to activate Node.js v$CLEAN_NODE_VERSION"
    echo ""
    info "Common causes:"
    echo "  • Node.js version not installed correctly"
    echo "  • fnm environment not properly initialized"
    echo "  • Incompatible Node.js version for your system architecture"
    echo "  • Disk space issues during installation"
    echo ""
    info "Troubleshooting steps:"
    echo "  1. Check fnm installation:"
    echo "     fnm --version"
    echo ""
    echo "  2. List installed Node.js versions:"
    echo "     fnm list"
    echo ""
    echo "  3. Try reinstalling the Node.js version:"
    echo "     fnm uninstall $CLEAN_NODE_VERSION"
    echo "     fnm install $CLEAN_NODE_VERSION"
    echo ""
    echo "  4. Check fnm environment:"
    echo "     eval \"\$(fnm env)\""
    echo "     fnm use $CLEAN_NODE_VERSION"
    echo ""
    info "Diagnostic commands:"
    echo "  • Check fnm directory: ls -la ~/.local/share/fnm/"
    echo "  • Check available disk space: df -h"
    echo "  • Check system architecture: uname -m"
    echo ""
    info "If using a non-standard Node.js version, try:"
    echo "  fnm install lts/latest"
    echo "  fnm use lts/latest"
    echo ""
    info "Documentation: https://github.com/Schniz/fnm#usage"
    info "Report issues: https://github.com/PalisadoesFoundation/talawa-api/issues"
    info "  Include: fnm version, OS, architecture, and error messages above"
    exit 1
fi
fnm default "$CLEAN_NODE_VERSION"

# Verify Node.js is available
if ! command_exists node; then
    error "Node.js installation succeeded but 'node' command not found in PATH"
    echo ""
    info "Common causes:"
    echo "  • Shell configuration needs to be refreshed"
    echo "  • fnm environment variables not set correctly"
    echo "  • PATH not updated with fnm binary location"
    echo ""
    info "Quick fix - Run these commands in your terminal:"
    echo "  export PATH=\"\$HOME/.local/share/fnm:\$PATH\""
    echo "  eval \"\$(fnm env)\""
    echo ""
    info "Permanent fix - Add to your shell configuration:"
    echo "  For bash (~/.bashrc):"
    echo "    echo 'export PATH=\"\$HOME/.local/share/fnm:\$PATH\"' >> ~/.bashrc"
    echo "    echo 'eval \"\$(fnm env)\"' >> ~/.bashrc"
    echo "    source ~/.bashrc"
    echo ""
    echo "  For zsh (~/.zshrc):"
    echo "    echo 'export PATH=\"\$HOME/.local/share/fnm:\$PATH\"' >> ~/.zshrc"
    echo "    echo 'eval \"\$(fnm env)\"' >> ~/.zshrc"
    echo "    source ~/.zshrc"
    echo ""
    info "Alternative - Open a new terminal window and run:"
    echo "  node --version"
    echo ""
    info "Diagnostic commands:"
    echo "  • Check PATH: echo \$PATH"
    echo "  • Find node binary: find ~/.local/share/fnm -name 'node' -type f 2>/dev/null"
    echo "  • Check fnm installations: ls -la ~/.local/share/fnm/node-versions/"
    echo "  • Check current shell: echo \$SHELL"
    echo ""
    info "Documentation: https://github.com/PalisadoesFoundation/talawa-api/blob/develop/INSTALLATION.md"
    info "Report issues: https://github.com/PalisadoesFoundation/talawa-api/issues"
    info "  Include: Output of 'echo \$PATH' and 'ls ~/.local/share/fnm/'"
    exit 1
fi

success "Node.js installed: $(node --version)"

##############################################################################
# Step 6: Install pnpm
##############################################################################
: $((CURRENT_STEP++))
step $CURRENT_STEP $TOTAL_STEPS "Installing pnpm v$PNPM_VERSION..."

PNPM_VERSION_CACHE="/tmp/.talawa-pnpm-latest-check"
PNPM_CACHE_MAX_AGE=86400  # 24 hours

if command_exists pnpm; then
    CURRENT_PNPM=$(pnpm --version)
    if [ "$PNPM_VERSION" = "latest" ]; then
        # Query npm registry for actual latest version
        LATEST_PNPM=$(npm view pnpm version 2>/dev/null) || LATEST_PNPM=""
         # Check if we recently verified the latest version
        SHOULD_CHECK=true
        if [ -f "$PNPM_VERSION_CACHE" ]; then
            CACHE_TIME=$(stat -c %Y "$PNPM_VERSION_CACHE" 2>/dev/null || echo 0)
            CURRENT_TIME=$(date +%s)
            CACHE_AGE=$((CURRENT_TIME - CACHE_TIME))
            if [ $CACHE_AGE -lt $PNPM_CACHE_MAX_AGE ]; then
                CACHED_VERSION=$(cat "$PNPM_VERSION_CACHE" 2>/dev/null)
                if [ "$CACHED_VERSION" = "$CURRENT_PNPM" ]; then
                    SHOULD_CHECK=false
                    success "pnpm is already at latest version: v$CURRENT_PNPM (verified within 24h)"
                fi
            fi
        fi
        
        if [ "$SHOULD_CHECK" = true ]; then
            # Query npm registry for actual latest version
            LATEST_PNPM=$(npm view pnpm version 2>/dev/null) || LATEST_PNPM=""
            if [ -n "$LATEST_PNPM" ] && [ "$CURRENT_PNPM" = "$LATEST_PNPM" ]; then
                echo "$CURRENT_PNPM" > "$PNPM_VERSION_CACHE"
                success "pnpm is already at latest version: v$CURRENT_PNPM"
            elif [ -n "$LATEST_PNPM" ]; then
                info "Updating pnpm from v$CURRENT_PNPM to latest (v$LATEST_PNPM)..."
                if ! retry_command "$MAX_RETRY_ATTEMPTS" npm install -g "pnpm@latest"; then
                    error "Failed to install pnpm after $MAX_RETRY_ATTEMPTS attempts"
                    exit 1
                fi
                echo "$LATEST_PNPM" > "$PNPM_VERSION_CACHE"
            else
                warn "Could not determine latest pnpm version from npm registry"
                info "Updating pnpm to latest version..."
                if ! retry_command "$MAX_RETRY_ATTEMPTS" npm install -g "pnpm@latest"; then
                    error "Failed to install pnpm after $MAX_RETRY_ATTEMPTS attempts"
                    exit 1
                fi
             fi
            
        fi
    elif [ "$CURRENT_PNPM" = "$PNPM_VERSION" ]; then
        success "pnpm is already installed: v$CURRENT_PNPM"
    else
        info "Updating pnpm from v$CURRENT_PNPM to v$PNPM_VERSION..."
        if ! retry_command "$MAX_RETRY_ATTEMPTS" npm install -g "pnpm@$PNPM_VERSION"; then
            error "Failed to install pnpm v$PNPM_VERSION after $MAX_RETRY_ATTEMPTS attempts"
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
    error "pnpm installation succeeded but 'pnpm' command not found in PATH"
    echo ""
    info "Common causes:"
    echo "  • npm global bin directory not in PATH"
    echo "  • Shell configuration needs to be refreshed"
    echo "  • pnpm installed in unexpected location"
    echo ""
    info "Quick fix - Find and add pnpm to PATH:"
    echo "  1. Find npm global bin directory:"
    echo "     npm config get prefix"
    echo ""
    echo "  2. Add to PATH (replace <prefix> with output from above):"
    echo "     export PATH=\"<prefix>/bin:\$PATH\""
    echo ""
    info "Alternative installation method:"
    echo "  curl -fsSL https://get.pnpm.io/install.sh | sh -"
    echo ""
    info "Permanent fix - Add npm global bin to shell configuration:"
    echo "  For bash (~/.bashrc):"
    echo "    echo 'export PATH=\"\$(npm config get prefix)/bin:\$PATH\"' >> ~/.bashrc"
    echo "    source ~/.bashrc"
    echo ""
    echo "  For zsh (~/.zshrc):"
    echo "    echo 'export PATH=\"\$(npm config get prefix)/bin:\$PATH\"' >> ~/.zshrc"
    echo "    source ~/.zshrc"
    echo ""
    info "Diagnostic commands:"
    echo "  • Check npm prefix: npm config get prefix"
    echo "  • List global packages: npm list -g --depth=0"
    echo "  • Find pnpm: which pnpm || find ~ -name 'pnpm' -type f 2>/dev/null | head -5"
    echo "  • Check PATH: echo \$PATH | tr ':' '\\n'"
    echo ""
    info "Documentation: https://pnpm.io/installation"
    info "Report issues: https://github.com/PalisadoesFoundation/talawa-api/issues"
    info "  Include: Output of 'npm config get prefix' and 'echo \$PATH'"
    exit 1
fi

success "pnpm installed: v$(pnpm --version)"

##############################################################################
# Step 7: Install project dependencies
##############################################################################
: $((CURRENT_STEP++))
step $CURRENT_STEP $TOTAL_STEPS "Installing project dependencies..."

# Make pnpm install idempotent by tracking lockfile hash (outside node_modules to survive deletion)
LOCKFILE_HASH_CACHE=".talawa-pnpm-lock-hash"
NEEDS_INSTALL=true

if [ -f "pnpm-lock.yaml" ]; then
    CURRENT_LOCKFILE_HASH=$(sha256sum pnpm-lock.yaml 2>/dev/null | cut -d ' ' -f 1)
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
        NEW_HASH=$(sha256sum pnpm-lock.yaml 2>/dev/null | cut -d ' ' -f 1)
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
echo "  export PATH=\"$FNM_BIN_DIR:\$PATH\""
echo "  eval \"\$(fnm env)\""
echo ""
info "Then restart your terminal or run: source ~/.bashrc (or ~/.zshrc)"
echo ""
info "To complete setup, run:"
echo "  pnpm run setup"
echo ""
