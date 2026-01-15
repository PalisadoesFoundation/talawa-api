#!/usr/bin/env bash
#
# Talawa API Installation Script
# 
# This script installs the Talawa API development environment.
# 
# Requirements:
#   - Bash 4.0 or higher
#   - Essential tools: grep, dirname, basename, uname, curl, git, awk, sed
#   - Supported platforms: Linux, macOS, WSL
# 
# Usage:
#   ./install.sh [OPTIONS]
#
# For more information, run:
#   ./install.sh --help
#

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Error code constants
readonly ERR_SCRIPT_NOT_FOUND=10
readonly ERR_PERMISSION_DENIED=11
readonly ERR_UNSUPPORTED_OS=12
readonly ERR_INVALID_OPTION=13
readonly ERR_SCRIPT_DIR_FAILED=14
readonly ERR_MISSING_TOOLS=15
readonly ERR_BASH_VERSION=16

# ----------------------------------------------------------------------------
# Minimum Requirements:
# - Bash version 4.0 or higher
# - Essential tools: grep, dirname, basename, uname, curl, git, awk, sed
# ----------------------------------------------------------------------------

# Check if bash version meets minimum requirement
check_bash_version() {
    local required_version="4.0"
    local required_major=4
    local required_minor=0
    
    # Check if running in bash
    if [ -z "${BASH_VERSION:-}" ]; then
        printf "%bError: This script requires Bash shell%b\n" "${RED}" "${NC}" >&2
        printf "\n" >&2
        printf "You are currently running: %s\n" "${SHELL:-unknown}" >&2
        printf "Please run this script with bash:\n" >&2
        printf "  bash %s\n" "$0" >&2
        printf "\n" >&2
        exit "$ERR_BASH_VERSION"
    fi
    
    # Extract major and minor version
    local current_version="${BASH_VERSION%%[^0-9.]*}"
    local current_major="${current_version%%.*}"
    local current_minor="${current_version#*.}"
    current_minor="${current_minor%%.*}"
    
    # Compare versions
    if [ "$current_major" -lt "$required_major" ] || 
       { [ "$current_major" -eq "$required_major" ] && [ "$current_minor" -lt "$required_minor" ]; }; then
        printf "%bError: Bash version %s or higher is required%b\n" "${RED}" "$required_version" "${NC}" >&2
        printf "Current version: %s\n" "$current_version" >&2
        printf "\n" >&2
        printf "Please upgrade your bash installation:\n" >&2
        
        # Provide OS-specific guidance
        local os_hint
        os_hint=$(uname -s 2>/dev/null || echo "Unknown")
        case "$os_hint" in
            Darwin*)
                printf "  macOS: brew install bash\n" >&2
                printf "  Then add to /etc/shells: echo /usr/local/bin/bash | sudo tee -a /etc/shells\n" >&2
                printf "  Change shell: chsh -s /usr/local/bin/bash\n" >&2
                ;;
            Linux*)
                if command -v apt-get >/dev/null 2>&1; then
                    printf "  Ubuntu/Debian: sudo apt-get update && sudo apt-get install bash\n" >&2
                elif command -v yum >/dev/null 2>&1; then
                    printf "  RHEL/CentOS: sudo yum update bash\n" >&2
                elif command -v dnf >/dev/null 2>&1; then
                    printf "  Fedora: sudo dnf update bash\n" >&2
                else
                    printf "  Use your package manager to update bash\n" >&2
                fi
                ;;
            *)
                printf "  Use your system's package manager to update bash\n" >&2
                ;;
        esac
        printf "\n" >&2
        exit "$ERR_BASH_VERSION"
    fi
    
    printf "%b✓ Bash version check passed (current: %s, required: >= %s)%b\n" "${GREEN}" "$current_version" "$required_version" "${NC}" >&2
}

# Check if essential tools are available
check_essential_tools() {
    local required_tools=("grep" "dirname" "basename" "uname" "curl" "git" "awk" "sed" "bash")
    local missing_tools=()
    
    # Check each required tool
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            missing_tools+=("$tool")
        fi
    done
    
    # Report missing tools
    if [ ${#missing_tools[@]} -gt 0 ]; then
        printf "%bError: Missing essential tools: %s%b\n" "${RED}" "${missing_tools[*]}" "${NC}" >&2
        printf "\n" >&2
        printf "Please install the missing tools:\n" >&2
        
        # Provide OS-specific guidance
        local os_hint
        os_hint=$(uname -s 2>/dev/null || echo "Unknown")
        case "$os_hint" in
            Darwin*)
                printf "  macOS:\n" >&2
                printf "    brew install coreutils curl git\n" >&2
                ;;
            Linux*)
                if command -v apt-get >/dev/null 2>&1; then
                    printf "  Ubuntu/Debian:\n" >&2
                    printf "    sudo apt-get update\n" >&2
                    printf "    sudo apt-get install coreutils curl git gawk sed bash\n" >&2
                elif command -v yum >/dev/null 2>&1; then
                    printf "  RHEL/CentOS:\n" >&2
                    printf "    sudo yum install coreutils curl git gawk sed bash\n" >&2
                elif command -v dnf >/dev/null 2>&1; then
                    printf "  Fedora:\n" >&2
                    printf "    sudo dnf install coreutils curl git gawk sed bash\n" >&2
                else
                    printf "  Use your package manager to install: %s\n" "${missing_tools[*]}" >&2
                fi
                ;;
            MINGW*|MSYS*|CYGWIN*)
                printf "  Windows (Git Bash):\n" >&2
                printf "    Reinstall Git for Windows from https://git-scm.com/\n" >&2
                printf "    Ensure 'Use Git and optional Unix tools from the Command Prompt' is selected\n" >&2
                ;;
            *)
                printf "  Please install using your system's package manager\n" >&2
                ;;
        esac
        printf "\n" >&2
        exit "$ERR_MISSING_TOOLS"
    fi
    
    printf "%b✓ Essential tools check passed%b\n" "${GREEN}" "${NC}" >&2
}

# Validate the environment meets requirements
validate_environment() {
    printf "%bValidating environment requirements...%b\n" "${BLUE}" "${NC}" >&2
    printf "\n" >&2
    
    check_bash_version
    check_essential_tools
    
    printf "\n" >&2
    printf "%b✓ Environment validation completed successfully!%b\n" "${GREEN}" "${NC}" >&2
    printf "\n" >&2
}

# Fixed: All messaging functions now write to stderr
info() { printf "%b%s\n" "${BLUE}ℹ${NC} " "$1" >&2; }
success() { printf "%b%s\n" "${GREEN}✓${NC} " "$1" >&2; }
warn() { printf "%b%s\n" "${YELLOW}⚠${NC} " "$1" >&2; }
error() { printf "%b%s\n" "${RED}✗${NC} " "$1" >&2; }

# Enhanced error message helper: provides actionable guidance, commands and links
error_with_guidance() {
    local error_title="$1"
    local error_details="$2"
    shift 2 || true
    local troubleshooting_steps=("$@")

    echo "" >&2
    printf "%b %s\n\n" "${RED}✗${NC}" "ERROR: $error_title" >&2

    if [ -n "$error_details" ]; then
        printf "Details: %s\n\n" "$error_details" >&2
    fi

    if [ ${#troubleshooting_steps[@]} -gt 0 ]; then
        printf "Troubleshooting steps:\n" >&2
        local step_num=1
        for step in "${troubleshooting_steps[@]}"; do
            printf "  %d. %s\n" "$step_num" "$step" >&2
            ((step_num++))
        done
        printf "\n" >&2
    fi

    printf "Documentation: https://docs.talawa.io/install (setup guide)\n" >&2
    printf "Search issues: https://github.com/PalisadoesFoundation/talawa-api/issues\n" >&2
    printf "Get help: https://github.com/PalisadoesFoundation/talawa-api/discussions\n\n" >&2
}

print_banner() {
    printf "%b\n" "${CYAN}" >&2
    printf "╔════════════════════════════════════════════════════════╗\n" >&2
    printf "║                                                        ║\n" >&2
    printf "║   ████████╗ █████╗ ██╗      █████╗ ██╗    ██╗ █████╗   ║\n" >&2
    printf "║   ╚══██╔══╝██╔══██╗██║     ██╔══██╗██║    ██║██╔══██╗  ║\n" >&2
    printf "║      ██║   ███████║██║     ███████║██║ █╗ ██║███████║  ║\n" >&2
    printf "║      ██║   ██╔══██║██║     ██╔══██║██║███╗██║██╔══██║  ║\n" >&2
    printf "║      ██║   ██║  ██║███████╗██║  ██║╚███╔███╔╝██║  ██║  ║\n" >&2
    printf "║      ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝  ║\n" >&2
    printf "║                                                        ║\n" >&2
    printf "║              One-Click Installation Script             ║\n" >&2
    printf "╚════════════════════════════════════════════════════════╝\n" >&2
    printf "%b\n" "${NC}" >&2
}

detect_os() {
    # First try OS environment variable (works on many systems)
    if [ -n "${OS:-}" ]; then
        local os_env="${OS,,}"
        case "$os_env" in
            linux*)
                printf "linux"
                return 0
                ;;
            darwin*)
                printf "macos"
                return 0
                ;;
            msys*|cygwin*|windows*)
                error_with_guidance "Windows environment detected" \
                    "This installer is intended for Linux and macOS shells" \
                    "For native Windows, run: install.ps1 from an elevated PowerShell prompt" \
                    "Alternatively, use WSL2 with Docker Desktop or run inside a Linux VM/Docker" \
                    "WSL install guide: https://learn.microsoft.com/windows/wsl/install" \
                    "Docker Desktop: https://docs.docker.com/desktop/"
                exit "$ERR_UNSUPPORTED_OS"
                ;;
        esac
    fi
    
    # Fallback to uname -s for robustness
    local os_name
    os_name=$(uname -s 2>/dev/null || printf "unknown")
    case "$os_name" in
        Linux*)
            printf "linux"
            ;;
        Darwin*)
            printf "macos"
            ;;
        MSYS*|MINGW*|CYGWIN*)
            error_with_guidance "Windows environment detected" \
                "Detected: $os_name" \
                "For native Windows, run: install.ps1 from an elevated PowerShell prompt" \
                "For WSL2: Ensure you're running from a WSL terminal (not Git Bash/MSYS)" \
                "WSL install guide: https://learn.microsoft.com/windows/wsl/install" \
                "Docker Desktop: https://docs.docker.com/desktop/"
            exit "$ERR_UNSUPPORTED_OS"
            ;;
        *)
            error_with_guidance "Unsupported operating system" \
                "Detected: $os_name / $(uname -m 2>/dev/null || echo 'unknown')" \
                "This installer supports Linux and macOS" \
                "For Windows: Run install.ps1 from PowerShell" \
                "For WSL: Ensure you're running from a WSL terminal" \
                "For other Unix systems: Check https://docs.talawa.io/install#platform-support" \
                "Report platform request: https://github.com/PalisadoesFoundation/talawa-api/issues/new"
            exit "$ERR_UNSUPPORTED_OS"
            ;;
    esac
}

is_wsl() {
    # Method 1: Check /proc/version for Microsoft or WSL keywords
    if [ -f /proc/version ]; then
        if grep -qEi 'microsoft|wsl' /proc/version 2>/dev/null; then
            [ "${WSL_DETECTION_DEBUG:-false}" = true ] && printf "[DEBUG] WSL detected via: /proc/version contains Microsoft/WSL\n" >&2
            return 0
        fi
    fi
    
    # Method 2: Check WSL_DISTRO_NAME environment variable
    if [ -n "${WSL_DISTRO_NAME:-}" ]; then
        [ "${WSL_DETECTION_DEBUG:-false}" = true ] && printf "[DEBUG] WSL detected via: WSL_DISTRO_NAME=%s\n" "$WSL_DISTRO_NAME" >&2
        return 0
    fi
    
    # Method 3: Check for /run/WSL or /run/wsl directory
    if [ -d "/run/WSL" ] || [ -d "/run/wsl" ]; then
        [ "${WSL_DETECTION_DEBUG:-false}" = true ] && printf "[DEBUG] WSL detected via: /run/WSL directory exists\n" >&2
        return 0
    fi
    
    # Method 4: Check for WSL interop flag
    if [ -f /proc/sys/fs/binfmt_misc/WSLInterop ]; then
        if grep -q "enabled" /proc/sys/fs/binfmt_misc/WSLInterop 2>/dev/null; then
            [ "${WSL_DETECTION_DEBUG:-false}" = true ] && printf "[DEBUG] WSL detected via: WSL interop enabled\n" >&2
            return 0
        fi
    fi
    
    # Method 5: Check /proc/sys/kernel/osrelease for Microsoft signature
    if [ -f /proc/sys/kernel/osrelease ]; then
        if grep -qi "microsoft" /proc/sys/kernel/osrelease 2>/dev/null; then
            [ "${WSL_DETECTION_DEBUG:-false}" = true ] && printf "[DEBUG] WSL detected via: /proc/sys/kernel/osrelease contains Microsoft\n" >&2
            return 0
        fi
    fi
    
    # No WSL detected
    [ "${WSL_DETECTION_DEBUG:-false}" = true ] && printf "[DEBUG] WSL not detected (checked 5 methods)\n" >&2
    return 1
}

check_disk_space() {
    local required_mb=$1
    local mode=$2
    
    # Get available space in MB (works on Linux and macOS)
    local available_mb
    if command -v df >/dev/null 2>&1; then
        available_mb=$(df -m . 2>/dev/null | awk 'NR==2 {print $4}' || echo "0")
        
        # Normalize available_mb: ensure it's numeric, default to 0 if empty or non-numeric
        if ! [[ "$available_mb" =~ ^[0-9]+$ ]]; then
            available_mb=0
        fi
        
        if [ "$available_mb" -lt "$required_mb" ]; then
            warn "Low disk space detected"
            warn "Available: ${available_mb}MB, Recommended: ${required_mb}MB for $mode mode"
            warn "Check disk space: df -h ."
            warn "Installation may fail if insufficient space"
            printf "\n" >&2
        fi
    fi
}

execute_installation_script() {
    local script_path="$1"
    local platform_name="$2"
    local mode="$3"
    local skip_prereqs="$4"
    local script_dir="$5"
    
    printf "\n" >&2
    printf "════════════════════════════════════════════════════════════\n" >&2
    info "Starting $platform_name installation"
    info "Mode: $mode"
    info "Skip prerequisites: $skip_prereqs"
    printf "════════════════════════════════════════════════════════════\n" >&2
    printf "\n" >&2
    
    local start_time
    start_time=$(date +%s)
    
    local exit_code=0
    bash "$script_path" "$mode" "$skip_prereqs" || exit_code=$?
    
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local minutes=$((duration / 60))
    local seconds=$((duration % 60))
    
    printf "\n" >&2
    printf "════════════════════════════════════════════════════════════\n" >&2
    
    if [ "$exit_code" -eq 0 ]; then
        success "$platform_name installation completed successfully!"
        info "Duration: ${minutes}m ${seconds}s"
        printf "════════════════════════════════════════════════════════════\n" >&2
        printf "\n" >&2
        return 0
    else
        error "$platform_name installation failed!"
        error "Exit code: $exit_code"
        error "Duration: ${minutes}m ${seconds}s"
        printf "════════════════════════════════════════════════════════════\n" >&2
        printf "\n" >&2
        
        display_failure_guidance "$exit_code" "$platform_name" "$mode" "$script_dir"
        
        # Exit immediately with the captured exit code
        exit "$exit_code"
    fi
}

display_failure_guidance() {
    local exit_code=$1
    local platform=$2
    local mode=$3
    local script_dir=$4
    local platform_dir
    
    platform_dir=$(printf "%s" "$platform" | tr '[:upper:]' '[:lower:]')
    
    error "Troubleshooting Guide:"
    printf "\n" >&2
    
    case $exit_code in
        1)
            info "  • General error - review error messages above"
            ;;
        2)
            info "  • Missing dependencies - ensure prerequisites are installed"
            info "  • Run with --skip-prereqs if you've already installed them manually"
            ;;
        126)
            info "  • Permission denied - check file permissions"
            info "    Try: chmod +x \"$script_dir/$platform_dir\"/*.sh"
            info "    Or run with: sudo ./scripts/install/install.sh"
            ;;
        127)
            info "  • Command not found - required tool may be missing"
            info "    Verify installations: docker --version, node --version, etc."
            ;;
        130)
            info "  • Installation interrupted (Ctrl+C)"
            info "    You can safely re-run the installer"
            ;;
        *)
            info "  • Unexpected error (exit code $exit_code)"
            info "    This may indicate a platform-specific issue"
            ;;
    esac
    
    printf "\n" >&2
    info "General troubleshooting steps:"
    printf "  1. Read error messages above carefully\n" >&2
    printf "  2. Verify all prerequisites are installed:\n" >&2
    
    if [ "$mode" = "docker" ]; then
        printf "     - Docker Engine (latest version)\n" >&2
        printf "       Check: docker --version\n" >&2
        printf "       Running: docker ps (daemon must be active)\n" >&2
        printf "     - Docker Compose (v2 or higher)\n" >&2
        printf "       Check: docker compose version\n" >&2
        printf "     - User in docker group: groups | grep docker\n" >&2
    else
        printf "     - Node.js LTS (v18 or v20)\n" >&2
        printf "       Check: node --version\n" >&2
        printf "     - npm or yarn package manager\n" >&2
        printf "       Check: npm --version\n" >&2
        printf "     - MongoDB (v5 or higher)\n" >&2
        printf "       Check: mongod --version\n" >&2
        printf "     - Redis (v6 or higher)\n" >&2
        printf "       Check: redis-server --version\n" >&2
    fi
    
    printf "  3. Check file permissions: ls -la \"%s/\"\n" "$script_dir" >&2
    printf "  4. Check disk space: df -h .\n" >&2
    if [ "$mode" = "docker" ]; then
        printf "     Need: ~2GB free for Docker mode\n" >&2
    else
        printf "     Need: ~500MB free for local mode\n" >&2
    fi
    printf "  5. Check network connectivity if downloading packages fails\n" >&2
    printf "     Test: ping -c 3 google.com\n" >&2
    printf "  6. Try with --skip-prereqs if prerequisites already verified\n" >&2
    printf "  7. Review documentation: https://docs.talawa.io\n" >&2
    printf "  8. Search existing issues: https://github.com/PalisadoesFoundation/talawa-api/issues\n" >&2
    printf "  9. Ask for help: https://github.com/PalisadoesFoundation/talawa-api/discussions\n" >&2
    printf "\n" >&2
    
    error "If issue persists, report it with:"
    printf "  • Complete error output above\n" >&2
    printf "  • System info: %s %s\n" "$(uname -s)" "$(uname -r)" >&2
    printf "  • Installation mode: %s\n" "$mode" >&2
    if [ "$mode" = "docker" ]; then
        printf "  • Docker version: %s\n" "$(docker --version 2>&1 || echo 'not installed')" >&2
        printf "  • Docker Compose version: %s\n" "$(docker compose version 2>&1 || echo 'not installed')" >&2
    else
        printf "  • Node version: %s\n" "$(node --version 2>&1 || echo 'not installed')" >&2
    fi
    printf "\n" >&2
}

validate_and_prepare_script() {
    local script_path="$1"
    local platform_name="$2"
    
    if [ ! -f "$script_path" ]; then
        local script_dir
        script_dir=$(dirname "$script_path")
        
        error_with_guidance "Installation script not found" \
            "Expected: $script_path" \
            "Verify you're in the repository root: pwd" \
            "List the directory: ls -la \"$script_dir\"" \
            "If git is available, restore missing files:" \
            "  git fetch --all && git checkout -- \"$script_dir\"" \
            "Check git repository status: git status" \
            "Verify network connectivity if git commands fail: ping -c 3 github.com" \
            "If problem persists, re-clone the repository:" \
            "  git clone https://github.com/PalisadoesFoundation/talawa-api" \
            "Alternative: Download from GitHub releases" \
            "See: https://docs.talawa.io/install#troubleshooting-scripts"
        exit "$ERR_SCRIPT_NOT_FOUND"
    fi
    
    if [ ! -x "$script_path" ]; then
        warn "$platform_name installation script not executable"
        info "Making script executable..."
        
        chmod +x "$script_path" || {
            error_with_guidance "Failed to make script executable" \
                "Attempted: chmod +x \"$script_path\" but it failed" \
                "Check current permissions: ls -la \"$script_path\"" \
                "Try with elevated privileges: sudo chmod +x \"$script_path\"" \
                "If on a mounted filesystem, check mount options:" \
                "  mount | grep \"$(df \"$script_path\" | tail -1 | awk '{print $1}')\"" \
                "Common issues:" \
                "  - File on NFS/SMB share mounted with noexec" \
                "  - Read-only filesystem" \
                "  - SELinux/AppArmor restrictions" \
                "Workaround: Run directly with: bash \"$script_path\"" \
                "Docs: https://docs.talawa.io/install#permissions"
            exit "$ERR_PERMISSION_DENIED"
        }
        
        # Verify chmod actually worked (some filesystems ignore it)
        if [ ! -x "$script_path" ]; then
            warn "File system may not support execute permissions"
            info "Running script with bash directly as workaround"
            # Note: The actual execution will use 'bash $script_path' which works without +x
        else
            success "Script is now executable"
        fi
    fi
}

show_usage() {
    printf "Usage: %s [options]\n" "$0" >&2
    printf "\n" >&2
    printf "Options:\n" >&2
    printf "  --docker       Install with Docker support (default)\n" >&2
    printf "  --local        Install for local development (no Docker)\n" >&2
    printf "  --skip-prereqs Skip prerequisite installation\n" >&2
    printf "  --help         Show this help message\n" >&2
    printf "\n" >&2
    printf "Examples:\n" >&2
    printf "  %s --docker\n" "$0" >&2
    printf "  %s --local\n" "$0" >&2
    printf "  %s --docker --skip-prereqs\n" "$0" >&2
    printf "\n" >&2
    printf "Documentation: https://docs.talawa.io/install\n" >&2
    printf "\n" >&2
}

INSTALL_MODE="docker"
SKIP_PREREQS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --docker)
            INSTALL_MODE="docker"
            shift
            ;;
        --local)
            INSTALL_MODE="local"
            shift
            ;;
        --skip-prereqs)
            SKIP_PREREQS=true
            shift
            ;;
        --help|-h)
            show_usage
            exit 0
            ;;
        *)
            error_with_guidance "Unknown option: $1" \
                "Valid options are: --docker, --local, --skip-prereqs, --help" \
                "Run with --help to see all available options and usage examples" \
                "Example: ./scripts/install/install.sh --docker" \
                "Example: ./scripts/install/install.sh --local --skip-prereqs" \
                "See installation guide: https://docs.talawa.io/install"
            show_usage
            exit "$ERR_INVALID_OPTION"
            ;;
    esac
done

main() {
    print_banner
    
    # Validate environment before anything else
    validate_environment
    
    local OS
    OS=$(detect_os)
    
    info "Detected OS: $OS"
    info "Installation mode: $INSTALL_MODE"
    
    # Check disk space requirements
    if [ "$INSTALL_MODE" = "docker" ]; then
        check_disk_space 2048 "Docker"
    else
        check_disk_space 512 "local"
    fi
    
    if is_wsl; then
        warn "Running in WSL environment"
        if [ "$INSTALL_MODE" = "docker" ]; then
            warn "For Docker support in WSL, you have two options:"
            info "  1. Install Docker Desktop for Windows and enable WSL integration (recommended)"
            info "     See: https://docs.docker.com/desktop/wsl/"
            info "  2. Install Docker Engine directly in WSL (advanced)"
            info "     See: https://docs.docker.com/engine/install/ubuntu/"
            printf "\n" >&2
            
            # Check if Docker is accessible
            if ! command -v docker >/dev/null 2>&1; then
                warn "Docker command not found in WSL"
                warn "You may need to install Docker Desktop or Docker Engine first"
            elif ! docker ps >/dev/null 2>&1; then
                warn "Docker daemon not accessible"
                warn "If using Docker Desktop, ensure WSL integration is enabled"
                warn "If using Docker Engine, ensure the daemon is running: sudo service docker start"
            fi
        fi
    fi
    
    local SCRIPT_DIR
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)" || {
        error_with_guidance "Failed to determine script directory" \
            "Could not resolve the installation script path" \
            "Check current working directory: pwd" \
            "Ensure script path is accessible: ls -la \"${BASH_SOURCE[0]}\"" \
            "Try running from repository root directory" \
            "Check for broken symlinks: file \"${BASH_SOURCE[0]}\"" \
            "Verify file system permissions and mount status"
        exit "$ERR_SCRIPT_DIR_FAILED"
    }
    
    case $OS in
        linux)
            local LINUX_SCRIPT="$SCRIPT_DIR/linux/install-linux.sh"
            validate_and_prepare_script "$LINUX_SCRIPT" "Linux"
            execute_installation_script "$LINUX_SCRIPT" "Linux" "$INSTALL_MODE" "$SKIP_PREREQS" "$SCRIPT_DIR"
            ;;
            
        macos)
            local MACOS_SCRIPT="$SCRIPT_DIR/macos/install-macos.sh"
            validate_and_prepare_script "$MACOS_SCRIPT" "macOS"
            execute_installation_script "$MACOS_SCRIPT" "macOS" "$INSTALL_MODE" "$SKIP_PREREQS" "$SCRIPT_DIR"
            ;;
            
        *)
            error_with_guidance "Unsupported operating system: $OS" \
                "Detected: $(uname -s 2>/dev/null || echo 'unknown') / $(uname -m 2>/dev/null || echo 'unknown')" \
                "This installer supports Linux and macOS" \
                "For Windows: Run install.ps1 from an elevated PowerShell prompt" \
                "For WSL: Ensure you're running from a WSL terminal (not Git Bash/MSYS)" \
                "For other Unix systems: Check platform support at https://docs.talawa.io/install#platform-support" \
                "Request support for your platform: https://github.com/PalisadoesFoundation/talawa-api/issues/new"
            exit "$ERR_UNSUPPORTED_OS"
            ;;
    esac
    
    # Only reached if installation succeeded
    printf "\n" >&2
    printf "╔════════════════════════════════════════════════════════════╗\n" >&2
    printf "║                                                            ║\n" >&2
    printf "║        🎉 Installation Completed Successfully! 🎉          ║\n" >&2
    printf "║                                                            ║\n" >&2
    printf "╚════════════════════════════════════════════════════════════╝\n" >&2
    printf "\n" >&2
    success "Talawa API development environment is ready!"
    printf "\n" >&2
    info "Next steps:"
    
    if [ "$INSTALL_MODE" = "docker" ]; then
        printf "  1. Review Docker Compose configuration in docker/ directory\n" >&2
        printf "  2. Start services: docker compose up -d\n" >&2
        printf "  3. Check logs: docker compose logs -f\n" >&2
        printf "  4. Access API at: http://localhost:4000\n" >&2
    else
        printf "  1. Configure your environment variables (copy .env.sample to .env)\n" >&2
        printf "  2. Start MongoDB: sudo service mongod start\n" >&2
        printf "  3. Start Redis: sudo service redis-server start\n" >&2
        printf "  4. Run: npm run start_development_server\n" >&2
    fi
    
    printf "\n" >&2
    info "Documentation: https://docs.talawa.io"
    info "Contributing Guide: https://docs.talawa.io/contributing"
    printf "\n" >&2
}

main