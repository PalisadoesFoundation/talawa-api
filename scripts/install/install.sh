#!/bin/bash

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

info() { printf "${BLUE}ℹ${NC} %s\n" "$1"; }
success() { printf "${GREEN}✓${NC} %s\n" "$1"; }
warn() { printf "${YELLOW}⚠${NC} %s\n" "$1"; }
error() { printf "${RED}✗${NC} %s\n" "$1"; }

print_banner() {
    printf "${CYAN}\n"
    printf "╔════════════════════════════════════════════════════════╗\n"
    printf "║                                                        ║\n"
    printf "║   ████████╗ █████╗ ██╗      █████╗ ██╗    ██╗ █████╗   ║\n"
    printf "║   ╚══██╔══╝██╔══██╗██║     ██╔══██╗██║    ██║██╔══██╗  ║\n"
    printf "║      ██║   ███████║██║     ███████║██║ █╗ ██║███████║  ║\n"
    printf "║      ██║   ██╔══██║██║     ██╔══██║██║███╗██║██╔══██║  ║\n"
    printf "║      ██║   ██║  ██║███████╗██║  ██║╚███╔███╔╝██║  ██║  ║\n"
    printf "║      ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝  ║\n"
    printf "║                                                        ║\n"
    printf "║              One-Click Installation Script             ║\n"
    printf "╚════════════════════════════════════════════════════════╝\n"
    printf "${NC}\n"
}

execute_installation_script() {
    local script_path="$1"
    local platform_name="$2"
    local mode="$3"
    local skip_prereqs="$4"
    local script_dir="$5"
    
    printf "\n"
    printf "════════════════════════════════════════════════════════════\n"
    info "Starting $platform_name installation"
    info "Mode: $mode"
    info "Skip prerequisites: $skip_prereqs"
    printf "════════════════════════════════════════════════════════════\n"
    printf "\n"
    
    local start_time
    start_time=$(date +%s)
    
    local exit_code=0
    bash "$script_path" "$mode" "$skip_prereqs" || exit_code=$?
    
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local minutes=$((duration / 60))
    local seconds=$((duration % 60))
    
    printf "\n"
    printf "════════════════════════════════════════════════════════════\n"
    
    if [ "$exit_code" -eq 0 ]; then
        success "$platform_name installation completed successfully!"
        info "Duration: ${minutes}m ${seconds}s"
        printf "════════════════════════════════════════════════════════════\n"
        printf "\n"
        return 0
    else
        error "$platform_name installation failed!"
        error "Exit code: $exit_code"
        error "Duration: ${minutes}m ${seconds}s"
        printf "════════════════════════════════════════════════════════════\n"
        printf "\n"
        
        display_failure_guidance "$exit_code" "$platform_name" "$mode" "$script_dir"
        
        return "$exit_code"
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
    printf "\n"
    
    case $exit_code in
        1)
            info "  • General error - review error messages above"
            ;;
        2)
            info "  • Missing dependencies - ensure prerequisites are installed"
            ;;
        126)
            info "  • Permission denied - check file permissions"
            info "    Try: chmod +x \"$script_dir/$platform_dir/\"*.sh"
            ;;
        127)
            info "  • Command not found - required tool may be missing"
            ;;
        130)
            info "  • Installation interrupted (Ctrl+C)"
            ;;
        *)
            info "  • Unexpected error (exit code $exit_code)"
            ;;
    esac
    
    printf "\n"
    info "General troubleshooting steps:"
    printf "  1. Read error messages above carefully\n"
    printf "  2. Verify all prerequisites are installed:\n"
    
    if [ "$mode" = "docker" ]; then
        printf "     - Docker Engine (latest version)\n"
        printf "     - Docker Compose (v2 or higher)\n"
    else
        printf "     - Node.js LTS (v18 or v20)\n"
        printf "     - MongoDB (v5 or higher)\n"
        printf "     - Redis (v6 or higher)\n"
    fi
    
    printf "  3. Check file permissions: ls -la \"%s/\"\n" "$script_dir"
    printf "  4. Ensure sufficient disk space\n"
    printf "  5. Try with --skip-prereqs if prerequisites verified\n"
    printf "  6. Review documentation: https://docs.talawa.io\n"
    printf "  7. Search existing issues: https://github.com/PalisadoesFoundation/talawa-api/issues\n"
    printf "  8. Ask for help: https://github.com/PalisadoesFoundation/talawa-api/discussions\n"
    printf "\n"
    
    error "If issue persists, report it with:"
    printf "  • Complete error output above\n"
    printf "  • System info: %s %s\n" "$(uname -s)" "$(uname -r)"
    printf "  • Installation mode: %s\n" "$mode"
    printf "\n"
}

validate_and_prepare_script() {
    local script_path="$1"
    local platform_name="$2"
    
    if [ ! -f "$script_path" ]; then
        error "$platform_name installation script not found: $script_path"
        exit 1
    fi
    
    if [ ! -x "$script_path" ]; then
        warn "$platform_name installation script not executable"
        info "Making script executable..."
        chmod +x "$script_path" || {
            error "Failed to make script executable"
            info "Try: chmod +x \"$script_path\""
            exit 1
        }
    fi
}

detect_os() {
    # Try $OSTYPE first, fall back to uname -s for robustness
    if [[ -n "${OSTYPE:-}" ]]; then
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            printf "linux"
            return 0
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            printf "macos"
            return 0
        fi
    fi
    
    # Fallback to uname -s
    local os_name
    os_name=$(uname -s 2>/dev/null || printf "unknown")
    case "$os_name" in
        Linux*)
            printf "linux"
            ;;
        Darwin*)
            printf "macos"
            ;;
        *)
            printf "unknown"
            ;;
    esac
}

is_wsl() {
    local detection_method=""
    
    # Method 1: Check /proc/version for Microsoft or WSL keywords (improved regex)
    if [ -f /proc/version ]; then
        if grep -qEi 'microsoft|wsl' /proc/version 2>/dev/null; then
            detection_method="/proc/version contains Microsoft/WSL"
            [ "${WSL_DETECTION_DEBUG:-false}" = true ] && printf "[DEBUG] WSL detected via: %s\n" "$detection_method" >&2
            return 0
        fi
    fi
    
    # Method 2: Check WSL_DISTRO_NAME environment variable
    if [ -n "${WSL_DISTRO_NAME:-}" ]; then
        detection_method="WSL_DISTRO_NAME environment variable set to '$WSL_DISTRO_NAME'"
        [ "${WSL_DETECTION_DEBUG:-false}" = true ] && printf "[DEBUG] WSL detected via: %s\n" "$detection_method" >&2
        return 0
    fi
    
    # Method 3: Check for /run/WSL or /run/wsl directory (case-insensitive)
    if [ -d "/run/WSL" ] || [ -d "/run/wsl" ]; then
        detection_method="/run/WSL directory exists"
        [ "${WSL_DETECTION_DEBUG:-false}" = true ] && printf "[DEBUG] WSL detected via: %s\n" "$detection_method" >&2
        return 0
    fi
    
    # Method 4: Check for WSL interop flag
    if [ -f /proc/sys/fs/binfmt_misc/WSLInterop ]; then
        if grep -q "enabled" /proc/sys/fs/binfmt_misc/WSLInterop 2>/dev/null; then
            detection_method="WSL interop enabled"
            [ "${WSL_DETECTION_DEBUG:-false}" = true ] && printf "[DEBUG] WSL detected via: %s\n" "$detection_method" >&2
            return 0
        fi
    fi
    
    # Method 5: Check /proc/sys/kernel/osrelease for Microsoft signature
    if [ -f /proc/sys/kernel/osrelease ]; then
        if grep -qi "microsoft" /proc/sys/kernel/osrelease 2>/dev/null; then
            detection_method="/proc/sys/kernel/osrelease contains Microsoft"
            [ "${WSL_DETECTION_DEBUG:-false}" = true ] && printf "[DEBUG] WSL detected via: %s\n" "$detection_method" >&2
            return 0
        fi
    fi
    
    # No WSL detected after checking all methods
    [ "${WSL_DETECTION_DEBUG:-false}" = true ] && printf "[DEBUG] WSL not detected (checked 5 methods)\n" >&2
    return 1
}

show_usage() {
    printf "Usage: %s [options]\n" "$0"
    printf "\n"
    printf "Options:\n"
    printf "  --docker       Install with Docker support (default)\n"
    printf "  --local        Install for local development (no Docker)\n"
    printf "  --skip-prereqs Skip prerequisite installation\n"
    printf "  --help         Show this help message\n"
    printf "\n"
    printf "Examples:\n"
    printf "  %s --docker\n" "$0"
    printf "  %s --local\n" "$0"
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
            error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

main() {
    print_banner
    
    local OS
    OS=$(detect_os)
    
    info "Detected OS: $OS"
    info "Installation mode: $INSTALL_MODE"
    
    if is_wsl; then
        warn "Running in WSL environment"
        if [ "$INSTALL_MODE" = "docker" ]; then
            warn "For Docker support in WSL, you have two options:"
            info "  1. Install Docker Desktop for Windows and enable WSL integration (recommended)"
            info "     See: https://docs.docker.com/desktop/wsl/"
            info "  2. Install Docker Engine directly in WSL (advanced)"
            info "     See: https://docs.docker.com/engine/install/ubuntu/"
            printf "\n"
        fi
    fi
    
    local SCRIPT_DIR
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    local ret=0
    
    case $OS in
        linux)
            local LINUX_SCRIPT="$SCRIPT_DIR/linux/install-linux.sh"
            validate_and_prepare_script "$LINUX_SCRIPT" "Linux"
            execute_installation_script "$LINUX_SCRIPT" "Linux" "$INSTALL_MODE" "$SKIP_PREREQS" "$SCRIPT_DIR"
            ret=$?
            if [ "$ret" -ne 0 ]; then
                exit "$ret"
            fi
            ;;
            
        macos)
            local MACOS_SCRIPT="$SCRIPT_DIR/macos/install-macos.sh"
            validate_and_prepare_script "$MACOS_SCRIPT" "macOS"
            execute_installation_script "$MACOS_SCRIPT" "macOS" "$INSTALL_MODE" "$SKIP_PREREQS" "$SCRIPT_DIR"
            ret=$?
            if [ "$ret" -ne 0 ]; then
                exit "$ret"
            fi
            ;;
            
        *)
            error "Unsupported operating system: $OS"
            info "Supported platforms: Linux, macOS"
            info "For Windows, use: install.ps1"
            exit 1
            ;;
    esac
    
    # Only reached if installation succeeded
    printf "\n"
    printf "╔════════════════════════════════════════════════════════════╗\n"
    printf "║                                                            ║\n"
    printf "║        🎉 Installation Completed Successfully! 🎉          ║\n"
    printf "║                                                            ║\n"
    printf "╚════════════════════════════════════════════════════════════╝\n"
    printf "\n"
    success "Talawa API development environment is ready!"
    printf "\n"
    info "Next steps:"
    
    if [ "$INSTALL_MODE" = "docker" ]; then
        printf "  1. Review Docker Compose configuration in docker/ directory\n"
        printf "  2. Start services using Docker Compose\n"
        printf "  3. Check logs for service status\n"
    else
        printf "  1. Configure your environment variables\n"
        printf "  2. Start MongoDB and Redis services\n"
        printf "  3. Run: npm run start_development_server\n"
    fi
    
    printf "\n"
    info "Documentation: https://docs.talawa.io"
    printf "\n"
}

main
