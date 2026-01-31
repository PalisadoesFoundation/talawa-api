#!/usr/bin/env bash
##############################################################################
# Talawa API - Linux Installation Script
#
# This script installs all prerequisites for running Talawa API:
# - Git, curl, jq, unzip (system utilities)
# - Docker (optional, based on install mode)
# - fnm (Fast Node Manager)
# - Node.js (version from package.json)
# - pnpm (version from package.json)
#
##############################################################################
# SUPPORTED DISTRIBUTIONS
##############################################################################
# This script supports the following Linux distributions:
#
# Debian Family:
#   - Ubuntu (18.04+)
#   - Debian (10+)
#   - Linux Mint (19+)
#   - Pop!_OS (20.04+)
#
# Red Hat Family:
#   - Fedora (33+)
#   - RHEL (8+)
#   - CentOS (8+)
#
# Arch Family:
#   - Arch Linux
#   - Manjaro
#
# WSL2 (Windows Subsystem for Linux):
#   - All above distributions running under WSL2
#   - See WSL2 section below for specific guidance
#
##############################################################################
# USAGE
##############################################################################
#   ./scripts/install/linux/install-linux.sh [docker|local] [--skip-prereqs]
#
# Arguments (can be provided in any order):
#   docker        - Install with Docker support (default)
#   local         - Install without Docker (local development mode)
#   --skip-prereqs - Skip system package installation (use if already installed)
#
# Examples:
#   ./scripts/install/linux/install-linux.sh              # Docker mode
#   ./scripts/install/linux/install-linux.sh local        # Local mode
#   ./scripts/install/linux/install-linux.sh docker --skip-prereqs
#   ./scripts/install/linux/install-linux.sh --skip-prereqs docker  # Same as above
#   ./scripts/install/linux/install-linux.sh --skip-prereqs         # Docker mode, skip prereqs
#
##############################################################################
# ENVIRONMENT VARIABLES
##############################################################################
#   AUTO_YES=true   - Skip all confirmation prompts (non-interactive mode)
#                     Useful for automated deployments and scripted installs.
#                     When set, the script will not prompt before:
#                       - Downloading and executing Docker installer
#                       - Downloading and executing fnm installer
#
#   CI=true         - Same as AUTO_YES=true (for CI/CD pipelines)
#                     Automatically detected in GitHub Actions, Jenkins, etc.
#
#   DEBUG=1         - Enable debug logging for troubleshooting
#                     When set, the script will output additional diagnostic
#                     information including:
#                       - Detailed command execution logs
#                       - Environment variable states
#                       - Function entry/exit traces
#                     All debug output is prefixed with [DEBUG] and written
#                     to both console and the installation log file.
#                     Example: DEBUG=1 ./scripts/install/linux/install-linux.sh
#
##############################################################################
# WSL2 (Windows Subsystem for Linux) GUIDANCE
##############################################################################
# This script fully supports WSL2 environments. When WSL is detected, the
# script provides additional guidance specific to the WSL2 workflow.
#
# Prerequisites for WSL2:
#   1. Windows 10 version 2004+ or Windows 11
#   2. WSL2 enabled (run as Administrator in PowerShell):
#      wsl --install
#   3. A Linux distribution installed from Microsoft Store
#      (Ubuntu recommended)
#
# Recommended WSL2 Settings:
#   - Memory: At least 4GB allocated to WSL2
#   - Configure in %UserProfile%\.wslconfig:
#       [wsl2]
#       memory=8GB
#       processors=4
#
# Docker in WSL2:
#   For the best Docker experience in WSL2, we recommend using Docker Desktop
#   for Windows with WSL2 backend enabled, rather than installing Docker
#   directly inside WSL2. Benefits include:
#     - Seamless integration between Windows and Linux containers
#     - Shared Docker daemon across all WSL2 distros
#     - Better resource management and performance
#     - GUI tools via Docker Desktop dashboard
#
#   To enable Docker Desktop WSL2 integration:
#     1. Install Docker Desktop for Windows
#     2. Open Docker Desktop Settings
#     3. Go to Resources > WSL Integration
#     4. Enable integration with your WSL2 distro
#     5. The 'docker' command will be available in your WSL2 terminal
#
# Differences from Native Linux:
#   - File system performance: /mnt/c/ is slower than native Linux paths
#     Store your projects in ~/projects or /home/user/ for best performance
#   - Networking: WSL2 uses a virtual network; localhost access works seamlessly
#   - Docker: Uses Docker Desktop daemon on Windows rather than Linux daemon
#   - Memory: WSL2 manages memory dynamically; configure limits in .wslconfig
#
# Troubleshooting WSL2:
#   - If Docker commands fail, ensure Docker Desktop is running on Windows
#   - Restart WSL2 if needed: wsl --shutdown (from Windows PowerShell)
#   - Check WSL version: wsl -l -v (should show VERSION 2)
#
##############################################################################

set -euo pipefail

##############################################################################
# Script Configuration
##############################################################################
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="${SCRIPT_DIR}/../common"

# Parse arguments (position-independent)
INSTALL_MODE="docker"
SKIP_PREREQS="false"
for arg in "$@"; do
  case "$arg" in
    docker|local)
      INSTALL_MODE="$arg"
      ;;
    --skip-prereqs|true)
      SKIP_PREREQS="true"
      ;;
    false)
      # Ignore literal 'false' for backward compatibility with test harness
      ;;
    *)
      echo "Unknown argument: $arg"
      echo "Usage: $0 [docker|local] [--skip-prereqs]"
      exit 1
      ;;
  esac
done

##############################################################################
# Non-interactive Mode Configuration
##############################################################################
# AUTO_YES controls whether the script runs in non-interactive mode.
# When enabled, confirmation prompts are skipped automatically.
#
# The script automatically detects non-interactive environments:
#   1. If AUTO_YES=true is set explicitly
#   2. If CI=true is set (common in CI/CD pipelines)
#   3. If stdin is not a terminal (piped input or background execution)
##############################################################################
AUTO_YES="${AUTO_YES:-${CI:-false}}"

##############################################################################
# Source Common Libraries
##############################################################################

# Source logging library first (provides info, warn, error, success, debug, etc.)
if [ ! -f "${COMMON_DIR}/logging.sh" ]; then
    echo "ERROR: Logging library not found: ${COMMON_DIR}/logging.sh" >&2
    echo "Please ensure the installation directory structure is intact." >&2
    exit 1
fi
# shellcheck source=../common/logging.sh
source "${COMMON_DIR}/logging.sh"

# Source OS detection library (provides detect_os, detect_distro, is_wsl, etc.)
if [ ! -f "${COMMON_DIR}/os-detection.sh" ]; then
    error "OS detection library not found: ${COMMON_DIR}/os-detection.sh"
    error "Please ensure the installation directory structure is intact."
    exit 1
fi
# shellcheck source=../common/os-detection.sh
source "${COMMON_DIR}/os-detection.sh"

# Source validation library (provides validate_version_string, parse_package_json, etc.)
if [ ! -f "${COMMON_DIR}/validation.sh" ]; then
    error "Validation library not found: ${COMMON_DIR}/validation.sh"
    error "Please ensure the installation directory structure is intact."
    exit 1
fi
# shellcheck source=../common/validation.sh
source "${COMMON_DIR}/validation.sh"

# Source package manager library (provides update_package_index, is_package_installed, etc.)
if [ ! -f "${COMMON_DIR}/package-manager.sh" ]; then
    error "Package manager library not found: ${COMMON_DIR}/package-manager.sh"
    error "Please ensure the installation directory structure is intact."
    exit 1
fi
# shellcheck source=../common/package-manager.sh
source "${COMMON_DIR}/package-manager.sh"

# Source Docker detection library (provides check_docker_requirements)
if [ ! -f "${COMMON_DIR}/docker-detection.sh" ]; then
    error "Docker detection library not found: ${COMMON_DIR}/docker-detection.sh"
    error "Please ensure the installation directory structure is intact."
    exit 1
fi
# shellcheck source=../common/docker-detection.sh
source "${COMMON_DIR}/docker-detection.sh"

# Source error handling library (provides setup_error_handling, register_cleanup_task, etc.)
if [ ! -f "${COMMON_DIR}/error-handling.sh" ]; then
    error "Error handling library not found: ${COMMON_DIR}/error-handling.sh"
    error "Please ensure the installation directory structure is intact."
    exit 1
fi
# shellcheck source=../common/error-handling.sh
source "${COMMON_DIR}/error-handling.sh"

##############################################################################
# Initialize Error Handling
##############################################################################
setup_error_handling

##############################################################################
# Configuration Constants
##############################################################################

# Installation paths
readonly FNM_INSTALL_DIR="${FNM_DIR:-$HOME/.local/share/fnm}"
readonly FNM_BIN_DIR="$FNM_INSTALL_DIR"

# Timeouts
readonly CURL_CONNECT_TIMEOUT=30
readonly CURL_MAX_TIME_DOCKER=300
readonly CURL_MAX_TIME_FNM=120
readonly MAX_RETRY_ATTEMPTS=3

# Disk space requirements
readonly MIN_DISK_SPACE_KB=2097152  # 2GB in KB

# Set OS_TYPE for package-manager.sh compatibility
export OS_TYPE="linux"

# Progress tracking
TOTAL_STEPS=7
CURRENT_STEP=0

##############################################################################
# Print Banner
##############################################################################
print_banner "Talawa API - Linux Installation"

##############################################################################
# WSL Detection and Guidance
##############################################################################
if is_wsl; then
    print_section "WSL Environment Detected"
    warn "Running under Windows Subsystem for Linux (WSL)"
    info ""
    info "WSL-Specific Recommendations:"
    info "  • For Docker workflows, prefer Docker Desktop with WSL2 integration"
    info "    over installing Docker directly in the WSL environment."
    info "  • Docker Desktop provides better performance and Windows integration."
    info "  • Enable WSL2 integration in Docker Desktop Settings > Resources > WSL Integration"
    info ""
    info "  If using Docker Desktop:"
    info "    1. Install Docker Desktop for Windows"
    info "    2. Enable WSL2 backend in Docker Desktop settings"
    info "    3. Enable integration with your WSL distro"
    info "    4. The 'docker' command will be available in your WSL terminal"
    info ""
    info "  Documentation: https://docs.docker.com/desktop/wsl/"
    info ""
    
    # Check if Docker Desktop WSL integration is already available
    if command_exists docker; then
        if docker info >/dev/null 2>&1; then
            success "Docker Desktop WSL integration detected and working"
        else
            warn "Docker command exists but daemon is not accessible."
            info "Ensure Docker Desktop is running and WSL integration is enabled."
        fi
    fi
fi

##############################################################################
# Helper Functions
##############################################################################

# Get the repository root directory
get_repo_root() {
    local script_dir repo_root
    # Prefer existing SCRIPT_DIR but do not mutate global SCRIPT_DIR
    if [[ -n "${SCRIPT_DIR:-}" ]]; then
        script_dir="$SCRIPT_DIR"
    else
        script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    fi
    # Navigate up from scripts/install/linux to repo root
    repo_root="$(cd "$script_dir/../../.." && pwd)"
    printf '%s\n' "$repo_root"
}

# Check if apt cache was updated recently (within the last hour)
apt_cache_is_fresh() {
    local apt_lists_dir="/var/lib/apt/lists"
    local cache_max_age=3600  # 1 hour in seconds

    if [[ -d "$apt_lists_dir" ]]; then
        local last_update
        last_update=$(find "$apt_lists_dir" -type f -printf '%T@\n' 2>/dev/null | sort -n | tail -1 | cut -d. -f1)
        if [[ -z "$last_update" ]]; then
            return 1
        fi
        local current_time
        current_time=$(date +%s)
        local cache_age=$((current_time - last_update))

        if [[ "$cache_age" =~ ^[0-9]+$ && "$cache_max_age" =~ ^[0-9]+$ && "$cache_age" -lt "$cache_max_age" ]]; then
            return 0
        fi
    fi
    return 1
}

# Check Docker Compose availability
check_docker_compose() {
    if docker compose version >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Check if Docker daemon is running
check_docker_running() {
    if docker info >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Validate package.json fields using jq
# This function reads and validates required fields from package.json
# It checks: package name matches "talawa-api", version, engines.node, packageManager
# Returns 0 on success, exits with error on failure
validate_package_json_fields() {
    # Verify this is the talawa-api repository
    local pkg_name
    pkg_name=$(jq -r '.name // empty' package.json 2>/dev/null)
    if [[ "$pkg_name" != "talawa-api" ]]; then
        error "This script must be run from the talawa-api repository."
        info "  Found package name: '$pkg_name'"
        info "  Expected: 'talawa-api'"
        info ""
        info "Remediation: Ensure you are in the correct directory and try again."
        exit 1
    fi

    # Validate required package.json fields
    local missing_fields=""

    PKG_VERSION=$(jq -r '.version // empty' package.json 2>/dev/null)
    [[ -z "$PKG_VERSION" ]] && missing_fields="$missing_fields version"

    NODE_ENGINE=$(jq -r '.engines.node // empty' package.json 2>/dev/null)
    [[ -z "$NODE_ENGINE" ]] && missing_fields="$missing_fields engines.node"

    PKG_MANAGER=$(jq -r '.packageManager // empty' package.json 2>/dev/null)
    [[ -z "$PKG_MANAGER" ]] && missing_fields="$missing_fields packageManager"

    if [[ -n "$missing_fields" ]]; then
        error "Required fields missing from package.json:$missing_fields"
        info ""
        info "Remediation steps:"
        info "  1. Ensure you have the latest version of the repository:"
        info "     git pull origin develop"
        info "  2. If the issue persists, re-clone the repository:"
        info "     git clone https://github.com/PalisadoesFoundation/talawa-api.git"
        exit 1
    fi

    # SECURITY: Validate engines.node format early (prevent command injection)
    # Must run before any install steps so malicious version strings fail fast.
    if [ -n "$NODE_ENGINE" ]; then
        if ! validate_version_string "$NODE_ENGINE" "Node.js version (engines.node)"; then
            handle_version_validation_error "Node.js version (engines.node)" "$NODE_ENGINE" ".engines.node"
        fi
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
        info ""
        info "Remediation steps:"
        info "  1. Free up disk space by removing unnecessary files"
        info "  2. Check disk usage: df -h"
        info "  3. Find large files: du -sh * | sort -rh | head -10"
        exit 1
    fi
}

check_git_repo() {
    # Verify git repository exists
    if [ ! -d ".git" ]; then
        error "This directory is not a git repository."
        info ""
        info "Remediation steps:"
        info "  1. Clone the repository properly:"
        info "     git clone https://github.com/PalisadoesFoundation/talawa-api.git"
        info "  2. Navigate to the cloned directory: cd talawa-api"
        exit 1
    fi

    return 0
}

##############################################################################
# Repository Validation
##############################################################################
REPO_ROOT=$(get_repo_root)
cd "$REPO_ROOT"

print_section "Repository Validation"

# Validate package.json exists
if [[ ! -f "package.json" ]]; then
    error "package.json not found. Please run this script from the talawa-api repository root."
    info ""
    info "Remediation steps:"
    info "  1. Clone the repository: git clone https://github.com/PalisadoesFoundation/talawa-api.git"
    info "  2. Navigate to the repository: cd talawa-api"
    info "  3. Run this script again"
    exit 1
fi

# Check if jq is available for JSON parsing
# If not installed and we're not skipping prereqs, defer validation until after prereqs are installed
JQ_AVAILABLE=false
if command_exists jq; then
    JQ_AVAILABLE=true
else
    if [[ "$SKIP_PREREQS" == "true" ]]; then
        # User explicitly skipped prereqs but jq is missing - this is an error
        error "jq is required but not installed."
        info ""
        info "jq is a lightweight JSON processor needed to validate package.json"
        info ""
        info "Install jq using your package manager:"
        info "  • Ubuntu/Debian:  sudo apt-get install jq"
        info "  • Fedora/RHEL:    sudo dnf install jq"
        info "  • Arch/Manjaro:   sudo pacman -S jq"
        info ""
        info "After installing jq, re-run this script"
        exit 1
    else
        # jq will be installed during prerequisites step - defer validation
        warn "jq is not installed yet; package.json validation will run after prerequisites installation."
    fi
fi

# Perform jq-dependent validations only if jq is available
# These will be re-run after prerequisites installation if deferred
if [[ "$JQ_AVAILABLE" == "true" ]]; then
    validate_package_json_fields
fi

# Validate disk space
# Use POSIX single-line output (-P) to avoid wrapped device names
AVAILABLE_SPACE_KB=$(df -kP "$REPO_ROOT" | awk 'NR==2 {print $4}')
# Guard against non-numeric df output before numeric comparison
if [[ -n "$AVAILABLE_SPACE_KB" && "$AVAILABLE_SPACE_KB" =~ ^[0-9]+$ && "$AVAILABLE_SPACE_KB" -lt "$MIN_DISK_SPACE_KB" ]]; then
    AVAILABLE_SPACE_MB=$((AVAILABLE_SPACE_KB / 1024))
    REQUIRED_SPACE_MB=$((MIN_DISK_SPACE_KB / 1024))
    error "Insufficient disk space. Available: ${AVAILABLE_SPACE_MB}MB, Required: ${REQUIRED_SPACE_MB}MB (2GB)"
    info ""
    info "Remediation steps:"
    info "  1. Free up disk space by removing unnecessary files"
    info "  2. Check disk usage: df -h"
    exit 1
fi

# Validate git repository (use -e to accept both .git directories and .git files for worktrees/submodules)
if [[ ! -e ".git" ]]; then
    error "This directory is not a git repository."
    info ""
    info "Remediation: Clone the repository properly:"
    info "  git clone https://github.com/PalisadoesFoundation/talawa-api.git"
    exit 1
fi

if command_exists git; then
    if ! git rev-parse --is-inside-work-tree &>/dev/null; then
        error "Invalid git repository. The .git directory may be corrupted."
        info "Remediation: Re-clone the repository from GitHub."
        exit 1
    fi
    
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        warn "You have uncommitted changes in your repository."
        info "Consider committing or stashing your changes before installation."
    fi
fi

success "Repository validation passed: talawa-api"

##############################################################################
# Detect Linux Distribution
##############################################################################
DISTRO=$(detect_distro)
DISTRO_FAMILY=$(detect_distro_family)
OS_VERSION=$(get_os_version)

info "Detected distribution: $DISTRO (family: $DISTRO_FAMILY, version: $OS_VERSION)"

##############################################################################
# Step 1: Install System Dependencies
##############################################################################
CURRENT_STEP=$((CURRENT_STEP + 1))
print_step "$CURRENT_STEP" "$TOTAL_STEPS" "Installing system dependencies..."

if [[ "$SKIP_PREREQS" == "true" ]]; then
    warn "Skipping prerequisite installation (--skip-prereqs)"
else
    INSTALLED_PREREQS=false
    PREREQ_PACKAGES="git curl jq unzip"
    
    case "$DISTRO_FAMILY" in
        debian)
            if apt_cache_is_fresh; then
                info "Package lists are up-to-date (updated within the last hour)"
            else
                info "Updating package lists..."
                sudo apt-get update -qq
            fi
            
            info "Installing $PREREQ_PACKAGES..."
            # shellcheck disable=SC2086
            sudo apt-get install -y -qq $PREREQ_PACKAGES
            INSTALLED_PREREQS=true
            ;;
        redhat)
            info "Installing $PREREQ_PACKAGES..."
            # shellcheck disable=SC2086
            sudo dnf install -y -q $PREREQ_PACKAGES
            INSTALLED_PREREQS=true
            ;;
        arch)
            info "Installing $PREREQ_PACKAGES..."
            # shellcheck disable=SC2086
            sudo pacman -S --noconfirm --quiet $PREREQ_PACKAGES
            INSTALLED_PREREQS=true
            ;;
        *)
            error "Unsupported distribution family: $DISTRO_FAMILY"
            info ""
            info "Supported distributions:"
            info "  • Debian family: Ubuntu, Debian, Linux Mint, Pop!_OS"
            info "  • Red Hat family: Fedora, RHEL, CentOS"
            info "  • Arch family: Arch Linux, Manjaro"
            info ""
            info "Manual installation required for: $PREREQ_PACKAGES"
            info ""
            info "After installing dependencies manually, re-run with:"
            info "  ./scripts/install/linux/install-linux.sh $INSTALL_MODE --skip-prereqs"
            info ""
            info "To report unsupported distros, include output of: cat /etc/os-release"
            info "Report issues: https://github.com/PalisadoesFoundation/talawa-api/issues"
            exit 1
            ;;
    esac
    
    if [[ "$INSTALLED_PREREQS" == "true" ]]; then
        success "System dependencies installed"
    fi
fi

##############################################################################
# Deferred Package.json Validation (after jq installation)
##############################################################################
# If jq was not available earlier, run the deferred validations now
if [[ "$JQ_AVAILABLE" == "false" ]]; then
    if command_exists jq; then
        info "Running deferred package.json validation..."
        validate_package_json_fields
        success "Deferred package.json validation passed"
    else
        error "jq installation failed or jq is not in PATH."
        info "Cannot validate package.json without jq."
        exit 1
    fi
fi

##############################################################################
# Step 2: Install Docker (optional)
##############################################################################
CURRENT_STEP=$((CURRENT_STEP + 1))
print_step "$CURRENT_STEP" "$TOTAL_STEPS" "Checking Docker installation..."

if [[ "$INSTALL_MODE" == "docker" ]]; then
    if command_exists docker; then
        success "Docker is already installed: $(docker --version)"
    elif [[ "$SKIP_PREREQS" == "true" ]]; then
        warn "Skipping Docker installation (--skip-prereqs)"
    else
        # Check for WSL with Docker Desktop recommendation
        if is_wsl; then
            warn "In WSL, we recommend using Docker Desktop with WSL2 integration"
            info "instead of installing Docker directly."
            info ""
            info "To use Docker Desktop:"
            info "  1. Install Docker Desktop for Windows"
            info "  2. Enable WSL2 backend and integration with this distro"
            info ""
            
            if [[ "$AUTO_YES" != "true" ]] && test -t 0; then
                read -p "Continue with native Docker installation anyway? (y/N): " -n 1 -r
                echo ""
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    warn "Docker installation skipped. Install Docker Desktop for Windows instead."
                    warn "Then re-run this script."
                    exit 0
                fi
            fi
        fi
        
        info "Installing Docker..."
        docker_installer="$(mktemp /tmp/get-docker.XXXXXX.sh)"
        register_cleanup_task "rm -f \"$docker_installer\""
        
        info "Downloading Docker installation script from https://get.docker.com..."
        if ! retry_command "$MAX_RETRY_ATTEMPTS" curl -fsSL --connect-timeout "$CURL_CONNECT_TIMEOUT" --max-time "$CURL_MAX_TIME_DOCKER" -o "$docker_installer" https://get.docker.com; then
            error "Failed to download Docker installer after multiple attempts."
            error "Check your internet connection and try again."
            rm -f "$docker_installer"
            exit 1
        fi
        success "Docker installer downloaded"
        
        # User confirmation before execution
        if [[ "$AUTO_YES" == "true" ]] || ! test -t 0; then
            info "Non-interactive mode: proceeding with Docker installation..."
        else
            info "You can review the script before installation:"
            info "  less $docker_installer"
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
            rm -f "$docker_installer"
            exit 1
        fi
        rm -f "$docker_installer"
        
        info "Adding current user to docker group..."
        sudo usermod -aG docker "$USER"
        
        warn "Docker group added. You may need to log out and back in for group changes to take effect."
        success "Docker installed successfully"
    fi
    
    # Check Docker Compose
    if command_exists docker-compose; then
        success "Docker Compose is available (standalone)"
    elif check_docker_compose; then
        success "Docker Compose is available (plugin)"
    else
        warn "Docker Compose not found."
    fi
    
    # Verify Docker is running
    if command_exists docker; then
        if check_docker_running; then
            success "Docker is running"
        else
            warn "Docker is installed but not running."
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
CURRENT_STEP=$((CURRENT_STEP + 1))
print_step "$CURRENT_STEP" "$TOTAL_STEPS" "Setting up Node.js version manager (fnm)..."

if command_exists fnm; then
    success "fnm is already installed"
    eval "$(fnm env)"
else
    info "Installing fnm (Fast Node Manager)..."
    fnm_installer="$(mktemp /tmp/fnm-install.XXXXXX.sh)"
    register_cleanup_task "rm -f \"$fnm_installer\""
    
    info "Downloading fnm installation script..."
    if ! retry_command "$MAX_RETRY_ATTEMPTS" curl -fsSL --connect-timeout "$CURL_CONNECT_TIMEOUT" --max-time "$CURL_MAX_TIME_FNM" -o "$fnm_installer" https://fnm.vercel.app/install; then
        error "Failed to download fnm installer after multiple attempts."
        rm -f "$fnm_installer"
        exit 1
    fi
    success "fnm installer downloaded"
    
    # User confirmation
    if [[ "$AUTO_YES" == "true" ]] || ! test -t 0; then
        info "Non-interactive mode: proceeding with fnm installation..."
    else
        info "You can review the script: less $fnm_installer"
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
        rm -f "$fnm_installer"
        exit 1
    fi
    rm -f "$fnm_installer"
    
    # Set up fnm for current session
    export PATH="$FNM_BIN_DIR:$PATH"
    eval "$(fnm env)"
    
    success "fnm installed successfully"
fi

##############################################################################
# Step 4: Read Versions from package.json
##############################################################################
CURRENT_STEP=$((CURRENT_STEP + 1))
print_step "$CURRENT_STEP" "$TOTAL_STEPS" "Reading configuration from package.json..."

# Extract Node.js version using safe parsing
NODE_VERSION=$(parse_package_json '.engines.node' "lts" "Node.js version (engines.node)" "false")

# Validate Node.js version string
if ! validate_version_string "$NODE_VERSION" "Node.js version (engines.node)"; then
    handle_version_validation_error "engines.node" "$NODE_VERSION" ".engines.node"
fi

# Clean version string (handle >=, ^, etc.)
if [[ "$NODE_VERSION" =~ ^(\^|>=|~) ]]; then
    CLEAN_NODE_VERSION=$(echo "$NODE_VERSION" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    if [[ -z "$CLEAN_NODE_VERSION" ]]; then
        CLEAN_NODE_VERSION=$(echo "$NODE_VERSION" | grep -oE '[0-9]+' | head -1)
    fi
else
    CLEAN_NODE_VERSION="$NODE_VERSION"
fi

# Fallback validation
if [ -z "$CLEAN_NODE_VERSION" ]; then
    warn "Could not determine Node.js version from package.json, using LTS"
    CLEAN_NODE_VERSION="lts"
fi

# Final validation of cleaned version
if ! validate_version_string "$CLEAN_NODE_VERSION" "cleaned Node.js version"; then
    handle_version_validation_error "cleaned Node.js version" "$CLEAN_NODE_VERSION" ".engines.node"
fi

# Extract pnpm version
PNPM_FULL=$(parse_package_json '.packageManager' "" "pnpm version (packageManager)" "false")

if [[ "$PNPM_FULL" == pnpm@* ]]; then
    PNPM_VERSION="${PNPM_FULL#pnpm@}"
    PNPM_VERSION="${PNPM_VERSION%%+*}"
    
    if [ -z "$PNPM_VERSION" ]; then
        warn "Could not extract pnpm version from '$PNPM_FULL', using latest"
        PNPM_VERSION="latest"
    fi
    
    if ! validate_version_string "$PNPM_VERSION" "pnpm version (packageManager)"; then
        handle_version_validation_error "packageManager" "$PNPM_VERSION" ".packageManager"
    fi
elif [[ -n "$PNPM_FULL" ]]; then
    warn "packageManager field '$PNPM_FULL' is not in expected format 'pnpm@version'"
    PNPM_VERSION="latest"
else
    info "No packageManager specified, using latest pnpm"
    PNPM_VERSION="latest"
fi

info "Target Node.js version: $CLEAN_NODE_VERSION"
info "Target pnpm version: $PNPM_VERSION"

##############################################################################
# Step 5: Install Node.js
##############################################################################
CURRENT_STEP=$((CURRENT_STEP + 1))
print_step "$CURRENT_STEP" "$TOTAL_STEPS" "Installing Node.js v$CLEAN_NODE_VERSION..."

fnm install "$CLEAN_NODE_VERSION"
if ! fnm use "$CLEAN_NODE_VERSION"; then
    error "Failed to activate Node.js v$CLEAN_NODE_VERSION"
    info ""
    info "Troubleshooting steps:"
    info "  1. Check fnm installation: fnm --version"
    info "  2. List installed versions: fnm list"
    info "  3. Try reinstalling: fnm uninstall $CLEAN_NODE_VERSION && fnm install $CLEAN_NODE_VERSION"
    info ""
    info "Documentation: https://github.com/Schniz/fnm#usage"
    exit 1
fi
fnm default "$CLEAN_NODE_VERSION"

# Verify Node.js is available
if ! command_exists node; then
    error "Node.js installation succeeded but 'node' command not found in PATH"
    info ""
    info "Add to your shell configuration (~/.bashrc or ~/.zshrc):"
    info "  export PATH=\"\$HOME/.local/share/fnm:\$PATH\""
    info "  eval \"\$(fnm env)\""
    info ""
    info "Then run: source ~/.bashrc (or ~/.zshrc)"
    exit 1
fi

success "Node.js installed: $(node --version)"

##############################################################################
# Step 6: Install pnpm
##############################################################################
CURRENT_STEP=$((CURRENT_STEP + 1))
print_step "$CURRENT_STEP" "$TOTAL_STEPS" "Installing pnpm v$PNPM_VERSION..."

PNPM_VERSION_CACHE="/tmp/.talawa-pnpm-latest-check"
PNPM_CACHE_MAX_AGE=86400  # 24 hours

if command_exists pnpm; then
    CURRENT_PNPM=$(pnpm --version)
    if [[ "$PNPM_VERSION" == "latest" ]]; then
        SHOULD_CHECK=true
                if [[ -f "$PNPM_VERSION_CACHE" ]]; then
                    CACHE_TIME=$(stat -c %Y "$PNPM_VERSION_CACHE" 2>/dev/null || printf '0')
            CURRENT_TIME=$(date +%s)
            CACHE_AGE=$((CURRENT_TIME - CACHE_TIME))
            if [[ "$CACHE_AGE" =~ ^[0-9]+$ && "$PNPM_CACHE_MAX_AGE" =~ ^[0-9]+$ && "$CACHE_AGE" -lt "$PNPM_CACHE_MAX_AGE" ]]; then
                CACHED_VERSION=$(cat "$PNPM_VERSION_CACHE" 2>/dev/null)
                if [[ "$CACHED_VERSION" == "$CURRENT_PNPM" ]]; then
                    SHOULD_CHECK=false
                    success "pnpm is already at latest version: v$CURRENT_PNPM (verified within 24h)"
                fi
            fi
        fi
        
        if [[ "$SHOULD_CHECK" == "true" ]]; then
            LATEST_PNPM=$(npm view pnpm version 2>/dev/null) || LATEST_PNPM=""
            if [[ -n "$LATEST_PNPM" && "$CURRENT_PNPM" == "$LATEST_PNPM" ]]; then
                printf '%s\n' "$CURRENT_PNPM" > "$PNPM_VERSION_CACHE"
                success "pnpm is already at latest version: v$CURRENT_PNPM"
            elif [[ -n "$LATEST_PNPM" ]]; then
                info "Updating pnpm from v$CURRENT_PNPM to latest (v$LATEST_PNPM)..."
                if ! retry_command "$MAX_RETRY_ATTEMPTS" npm install -g "pnpm@latest"; then
                    error "Failed to install pnpm after $MAX_RETRY_ATTEMPTS attempts"
                    exit 1
                fi
                printf '%s\n' "$LATEST_PNPM" > "$PNPM_VERSION_CACHE"
            else
                warn "Could not determine latest pnpm version"
                info "Updating pnpm to latest version..."
                if ! retry_command "$MAX_RETRY_ATTEMPTS" npm install -g "pnpm@latest"; then
                    error "Failed to install pnpm"
                    exit 1
                fi
            fi
        fi
    elif [[ "$CURRENT_PNPM" == "$PNPM_VERSION" ]]; then
        success "pnpm is already installed: v$CURRENT_PNPM"
    else
        info "Updating pnpm from v$CURRENT_PNPM to v$PNPM_VERSION..."
        if ! retry_command "$MAX_RETRY_ATTEMPTS" npm install -g "pnpm@$PNPM_VERSION"; then
            error "Failed to install pnpm v$PNPM_VERSION"
            exit 1
        fi
    fi
else
    info "Installing pnpm..."
    if ! retry_command "$MAX_RETRY_ATTEMPTS" npm install -g "pnpm@$PNPM_VERSION"; then
        error "Failed to install pnpm v$PNPM_VERSION"
        exit 1
    fi
fi

# Verify pnpm is available
if ! command_exists pnpm; then
    error "pnpm installation succeeded but 'pnpm' command not found in PATH"
    info ""
    info "Find npm global bin directory: npm config get prefix"
    info "Add to PATH: export PATH=\"\$(npm config get prefix)/bin:\$PATH\""
    exit 1
fi

success "pnpm installed: v$(pnpm --version)"

##############################################################################
# Step 7: Install Project Dependencies
##############################################################################
CURRENT_STEP=$((CURRENT_STEP + 1))
print_step "$CURRENT_STEP" "$TOTAL_STEPS" "Installing project dependencies..."

# Use git-aware path resolution for worktree/submodule compatibility
GIT_DIR="$(git rev-parse --git-dir 2>/dev/null || echo ".git")"
LOCKFILE_HASH_CACHE="${GIT_DIR}/.talawa-pnpm-lock-hash"
NEEDS_INSTALL=true

if [[ -f "pnpm-lock.yaml" ]]; then
    CURRENT_LOCKFILE_HASH=$(sha256sum pnpm-lock.yaml 2>/dev/null | cut -d ' ' -f 1)
    if [ -z "$CURRENT_LOCKFILE_HASH" ]; then
        warn "Failed to compute lockfile hash, proceeding with install"
        CURRENT_LOCKFILE_HASH="unknown"
    fi

    if [[ -d "node_modules" && -f "$LOCKFILE_HASH_CACHE" ]]; then
        CACHED_HASH=$(cat "$LOCKFILE_HASH_CACHE" 2>/dev/null) || CACHED_HASH=""
        if [[ "$CURRENT_LOCKFILE_HASH" == "$CACHED_HASH" ]]; then
            NEEDS_INSTALL=false
            success "Dependencies already up-to-date (lockfile unchanged)"
        fi
    fi
    
    if [[ "$NEEDS_INSTALL" == "true" ]]; then
        info "Installing dependencies..."
        if ! retry_command "$MAX_RETRY_ATTEMPTS" pnpm install; then
            error "Failed to install dependencies after $MAX_RETRY_ATTEMPTS attempts"
            info "Possible causes:"
            info "  - Network connectivity issues"
            info "  - Package registry temporarily unavailable"
            info "  - Corrupted pnpm cache (try: pnpm store prune)"
            exit 1
        fi
        if [[ "$CURRENT_LOCKFILE_HASH" != "unknown" ]]; then
            printf '%s\n' "$CURRENT_LOCKFILE_HASH" > "$LOCKFILE_HASH_CACHE" 2>/dev/null || warn "Failed to cache lockfile hash"
        fi
        success "Project dependencies installed"
    fi
else
    info "No pnpm-lock.yaml found, running fresh install..."
    if ! retry_command "$MAX_RETRY_ATTEMPTS" pnpm install; then
        error "Failed to install dependencies."
        exit 1
    fi
        if [ -f "pnpm-lock.yaml" ]; then
        NEW_HASH=$(sha256sum pnpm-lock.yaml 2>/dev/null | cut -d ' ' -f 1)
        if [ -n "$NEW_HASH" ]; then
            printf '%s\n' "$NEW_HASH" > "$LOCKFILE_HASH_CACHE" 2>/dev/null || warn "Failed to cache lockfile hash"
        fi
    fi
    success "Project dependencies installed"
fi

##############################################################################
# Installation Complete
##############################################################################
print_section "Installation Completed Successfully"

info "Installed versions:"
info "  Node.js: $(node --version)"
info "  pnpm:    v$(pnpm --version)"
if command_exists docker; then
    info "  Docker:  $(docker --version | cut -d ' ' -f 3 | tr -d ',')"
fi

if is_wsl; then
    info ""
    warn "WSL Note: Ensure Docker Desktop is running on Windows for Docker commands to work."
fi

info ""
warn "To make fnm available in new terminal sessions, add to your ~/.bashrc or ~/.zshrc:"
info "  export PATH=\"$FNM_BIN_DIR:\$PATH\""
info "  eval \"\$(fnm env)\""
info ""
info "Then restart your terminal or run: source ~/.bashrc (or ~/.zshrc)"
info ""
info "To complete setup, run:"
info "  pnpm run setup"

print_log_location
