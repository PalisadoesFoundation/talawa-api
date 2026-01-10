#!/bin/bash

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Fixed: All messaging functions now write to stderr
info() { printf "%b%s\n" "${BLUE}ℹ${NC} " "$1" >&2; }
success() { printf "%b%s\n" "${GREEN}✓${NC} " "$1" >&2; }
warn() { printf "%b%s\n" "${YELLOW}⚠${NC} " "$1" >&2; }
error() { printf "%b%s\n" "${RED}✗${NC} " "$1" >&2; }

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
    # Pass arguments based on skip_prereqs flag
    if [ "$skip_prereqs" = true ]; then
        bash "$script_path" "$mode" --skip-prereqs || exit_code=$?
    else
        bash "$script_path" "$mode" || exit_code=$?
    fi
    
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
            ;;
        126)
            info "  • Permission denied - check file permissions"
            info "    Try: chmod +x \"$script_dir/$platform_dir\"/*.sh"
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
    
    printf "\n" >&2
    info "General troubleshooting steps:"
    printf "  1. Read error messages above carefully\n" >&2
    printf "  2. Verify all prerequisites are installed:\n" >&2
    
    if [ "$mode" = "docker" ]; then
        printf "     - Docker Engine (latest version)\n" >&2
        printf "     - Docker Compose (v2 or higher)\n" >&2
    else
        printf "     - Node.js LTS (v18 or v20)\n" >&2
        printf "     - MongoDB (v5 or higher)\n" >&2
        printf "     - Redis (v6 or higher)\n" >&2
    fi
    
    printf "  3. Check file permissions: ls -la \"%s/\"\n" "$script_dir" >&2
    printf "  4. Ensure sufficient disk space\n" >&2
    printf "  5. Try with --skip-prereqs if prerequisites verified\n" >&2
    printf "  6. Review documentation: https://docs.talawa.io\n" >&2
    printf "  7. Search existing issues: https://github.com/PalisadoesFoundation/talawa-api/issues\n" >&2
    printf "  8. Ask for help: https://github.com/PalisadoesFoundation/talawa-api/discussions\n" >&2
    printf "\n" >&2
    
    error "If issue persists, report it with:"
    printf "  • Complete error output above\n" >&2
    printf "  • System info: %s %s\n" "$(uname -s)" "$(uname -r)" >&2
    printf "  • Installation mode: %s\n" "$mode" >&2
    printf "\n" >&2
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
    # Try $OSTYPE first (bash-specific), with MSYS/Cygwin support
    if [[ -n "${OSTYPE:-}" ]]; then
        case "$OSTYPE" in
            linux-gnu*)
                printf "linux"
                return 0
                ;;
            darwin*)
                printf "macos"
                return 0
                ;;
            msys*|cygwin*)
                # Git Bash / MSYS / Cygwin on Windows
                # Warning goes to stderr, doesn't pollute stdout
                printf "%b%s\n" "${YELLOW}⚠${NC} " "MSYS/Cygwin detected - use install.ps1 for native Windows installation" >&2
                printf "linux"  # Only "linux" goes to stdout for capture
                return 0
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
            # Warning goes to stderr, doesn't pollute stdout
            printf "%b%s\n" "${YELLOW}⚠${NC} " "Windows environment detected - consider using install.ps1" >&2
            printf "linux"  # Only "linux" goes to stdout for capture
            ;;
        *)
            printf "unknown"
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
            printf "\n" >&2
        fi
    fi
    
    local SCRIPT_DIR
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)" || {
        error "Failed to determine script directory"
        exit 1
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
            error "Unsupported operating system: $OS"
            info "Supported platforms: Linux, macOS"
            info "For Windows, use: install.ps1"
            exit 1
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
        printf "  2. Start services using Docker Compose\n" >&2
        printf "  3. Check logs for service status\n" >&2
    else
        printf "  1. Configure your environment variables\n" >&2
        printf "  2. Start MongoDB and Redis services\n" >&2
        printf "  3. Run: npm run start_development_server\n" >&2
    fi
    
    printf "\n" >&2
    info "Documentation: https://docs.talawa.io"
    printf "\n" >&2
}

main
