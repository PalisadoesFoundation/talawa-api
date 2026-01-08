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
    error "package.json not found in current directory: $PWD"
    echo ""
    info "Common causes:"
    echo "  • You haven't cloned the repository yet"
    echo "  • You're running the script from a different directory"
    echo "  • The repository is incomplete or corrupted"
    echo ""
    info "Troubleshooting steps:"
    echo "  1. Clone the repository (if not done already):"
    echo "     git clone https://github.com/PalisadoesFoundation/talawa-api.git"
    echo ""
    echo "  2. Navigate to the repository root:"
    echo "     cd talawa-api"
    echo ""
    echo "  3. Verify package.json exists:"
    echo "     ls -la package.json"
    echo ""
    echo "  4. Run this script again from the repository root"
    echo ""
    info "Diagnostic commands:"
    echo "  • Check current directory: pwd"
    echo "  • List files in current directory: ls -la"
    echo "  • Find package.json: find . -name 'package.json' -type f 2>/dev/null | head -5"
    echo ""
    info "Documentation: https://github.com/PalisadoesFoundation/talawa-api/blob/develop/INSTALLATION.md"
    info "Report issues: https://github.com/PalisadoesFoundation/talawa-api/issues"
    info "  Include: OS version, current directory, and output of 'ls -la'"
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

