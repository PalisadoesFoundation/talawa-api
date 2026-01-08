#!/bin/bash

##############################################################################
# Talawa API - One-Click Installation Script
# Entry point for Linux/macOS systems
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print colored output
info() { echo -e "${BLUE}ℹ${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }

# Print banner
print_banner() {
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║                                                        ║"
    echo "║   ████████╗ █████╗ ██╗      █████╗ ██╗    ██╗ █████╗   ║"
    echo "║   ╚══██╔══╝██╔══██╗██║     ██╔══██╗██║    ██║██╔══██╗  ║"
    echo "║      ██║   ███████║██║     ███████║██║ █╗ ██║███████║  ║"
    echo "║      ██║   ██╔══██║██║     ██╔══██║██║███╗██║██╔══██║  ║"
    echo "║      ██║   ██║  ██║███████╗██║  ██║╚███╔███╔╝██║  ██║  ║"
    echo "║      ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝  ║"
    echo "║                                                        ║"
    echo "║              One-Click Installation Script             ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    else
        echo "unknown"
    fi
}

is_wsl() {
    local detected=false
    local detection_method=""

    if [ -f /proc/version ]; then
        if grep -qi "microsoft\|wsl" /proc/version 2>/dev/null; then
            detected=true
            detection_method="/proc/version contains Microsoft/WSL"
        fi
    fi
    
    if [ "$detected" = false ] && [ -n "${WSL_DISTRO_NAME:-}" ]; then
        detected=true
        detection_method="WSL_DISTRO_NAME environment variable set to '$WSL_DISTRO_NAME'"
    fi
    
    if [ "$detected" = false ] && [ -d "/run/WSL" ]; then
        detected=true
        detection_method="/run/WSL directory exists"
    fi
    
    if [ "$detected" = false ] && [ -f /proc/sys/fs/binfmt_misc/WSLInterop ]; then
        detected=true
        detection_method="WSL interop enabled"
    fi
    
    if [ "$detected" = false ] && [ -f /proc/sys/kernel/osrelease ]; then
        if grep -qi "microsoft" /proc/sys/kernel/osrelease 2>/dev/null; then
            detected=true
            detection_method="/proc/sys/kernel/osrelease contains Microsoft"
        fi
    fi
    
    if [ "${WSL_DETECTION_DEBUG:-false}" = true ]; then
        if [ "$detected" = true ]; then
            echo "[DEBUG] WSL detected via: $detection_method" >&2
        else
            echo "[DEBUG] WSL not detected (checked 5 methods)" >&2
        fi
    fi
    
    [ "$detected" = true ]
}

# Show usage
show_usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --docker      Install with Docker support (default)"
    echo "  --local       Install for local development (no Docker)"
    echo "  --skip-prereqs Skip prerequisite installation"
    echo "  --help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --docker"
    echo "  $0 --local"
}

# Parse arguments
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

# Main
main() {
    print_banner
    
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
            echo ""
        fi
    fi
    
    # Get the directory where this script is located
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    case $OS in
        linux)
            info "Running Linux installation..."
            if [ -f "$SCRIPT_DIR/linux/install-linux.sh" ]; then
                bash "$SCRIPT_DIR/linux/install-linux.sh" "$INSTALL_MODE" "$SKIP_PREREQS"
            else
                error "Linux installation script not found: $SCRIPT_DIR/linux/install-linux.sh"
                exit 1
            fi
            ;;
        macos)
            info "Running macOS installation..."
            if [ -f "$SCRIPT_DIR/macos/install-macos.sh" ]; then
                bash "$SCRIPT_DIR/macos/install-macos.sh" "$INSTALL_MODE" "$SKIP_PREREQS"
            else
                error "macOS installation script not found: $SCRIPT_DIR/macos/install-macos.sh"
                exit 1
            fi
            ;;
        *)
            error "Unsupported operating system: $OS"
            error "Please use the Windows PowerShell script instead: install.ps1"
            exit 1
            ;;
    esac
    
    echo ""
    info "Next steps:"
    info "  1. Run 'pnpm run setup' to configure the application"
    info "  2. Follow the prompts to set up your environment"
}

main
