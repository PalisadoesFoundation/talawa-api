#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

info() { echo -e "${BLUE}ℹ${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }

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

execute_installation_script() {
    local script_path="$1"
    local platform_name="$2"
    local mode="$3"
    local skip_prereqs="$4"
    
    echo ""
    echo "════════════════════════════════════════════════════════════"
    info "Starting $platform_name installation"
    info "Mode: $mode"
    info "Skip prerequisites: $skip_prereqs"
    echo "════════════════════════════════════════════════════════════"
    echo ""
    
    local start_time
    start_time=$(date +%s)
    
    local exit_code=0
    bash "$script_path" "$mode" "$skip_prereqs" || exit_code=$?
    
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local minutes=$((duration / 60))
    local seconds=$((duration % 60))
    
    echo ""
    echo "════════════════════════════════════════════════════════════"
    
    if [ "$exit_code" -eq 0 ]; then
        success "$platform_name installation completed successfully!"
        info "Duration: ${minutes}m ${seconds}s"
        echo "════════════════════════════════════════════════════════════"
        echo ""
        return 0
    else
        error "$platform_name installation failed!"
        error "Exit code: $exit_code"
        error "Duration: ${minutes}m ${seconds}s"
        echo "════════════════════════════════════════════════════════════"
        echo ""
        
        display_failure_guidance "$exit_code" "$platform_name" "$mode"
        
        return $exit_code
    fi
}

display_failure_guidance() {
    local exit_code=$1
    local platform=$2
    local mode=$3
    local platform_dir
    
    platform_dir=$(echo "$platform" | tr '[:upper:]' '[:lower:]')
    
    error "Troubleshooting Guide:"
    echo ""
    
    case $exit_code in
        1)
            info "  • General error - review error messages above"
            ;;
        2)
            info "  • Missing dependencies - ensure prerequisites are installed"
            ;;
        126)
            info "  • Permission denied - check file permissions"
            info "    Try: chmod +x scripts/install/$platform_dir/*.sh"
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
    
    echo ""
    info "General troubleshooting steps:"
    echo "  1. Read error messages above carefully"
    echo "  2. Verify all prerequisites are installed:"
    
    if [ "$mode" = "docker" ]; then
        echo "     - Docker Engine (latest version)"
        echo "     - Docker Compose (v2 or higher)"
    else
        echo "     - Node.js LTS (v18 or v20)"
        echo "     - MongoDB (v5 or higher)"
        echo "     - Redis (v6 or higher)"
    fi
    
    echo "  3. Check file permissions: ls -la scripts/install/"
    echo "  4. Ensure sufficient disk space"
    echo "  5. Try with --skip-prereqs if prerequisites verified"
    echo "  6. Review documentation: https://docs.talawa.io"
    echo "  7. Search existing issues: https://github.com/PalisadoesFoundation/talawa-api/issues"
    echo "  8. Ask for help: https://github.com/PalisadoesFoundation/talawa-api/discussions"
    echo ""
    
    error "If issue persists, report it with:"
    echo "  • Complete error output above"
    echo "  • System info: $(uname -s) $(uname -r)"
    echo "  • Installation mode: $mode"
    echo ""
}

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
    if [ -f /proc/version ]; then
        if grep -qi "microsoft\|wsl" /proc/version 2>/dev/null; then
            return 0
        fi
    fi
    return 1
}

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
    
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    case $OS in
        linux)
            LINUX_SCRIPT="$SCRIPT_DIR/linux/install-linux.sh"
            
            if [ ! -f "$LINUX_SCRIPT" ]; then
                error "Linux installation script not found: $LINUX_SCRIPT"
                exit 1
            fi
            
            if [ ! -x "$LINUX_SCRIPT" ]; then
                warn "Linux installation script not executable"
                info "Making script executable..."
                chmod +x "$LINUX_SCRIPT" || {
                    error "Failed to make script executable"
                    info "Try: chmod +x $LINUX_SCRIPT"
                    exit 1
                }
            fi
            
            execute_installation_script "$LINUX_SCRIPT" "Linux" "$INSTALL_MODE" "$SKIP_PREREQS"
            local rc=$?
            if [ $rc -ne 0 ]; then
                exit $rc
            fi
            ;;
            
        macos)
            MACOS_SCRIPT="$SCRIPT_DIR/macos/install-macos.sh"
            
            if [ ! -f "$MACOS_SCRIPT" ]; then
                error "macOS installation script not found: $MACOS_SCRIPT"
                exit 1
            fi
            
            if [ ! -x "$MACOS_SCRIPT" ]; then
                warn "macOS installation script not executable"
                info "Making script executable..."
                chmod +x "$MACOS_SCRIPT" || {
                    error "Failed to make script executable"
                    info "Try: chmod +x $MACOS_SCRIPT"
                    exit 1
                }
            fi
            
            execute_installation_script "$MACOS_SCRIPT" "macOS" "$INSTALL_MODE" "$SKIP_PREREQS"
            local rc=$?
            if [ $rc -ne 0 ]; then
                exit $rc
            fi
            ;;
            
        *)
            error "Unsupported operating system: $OS"
            info "Supported platforms: Linux, macOS"
            info "For Windows, use: install.ps1"
            exit 1
            ;;
    esac
    
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║        🎉 Installation Completed Successfully! 🎉          ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    success "Talawa API development environment is ready!"
    echo ""
    info "Next steps:"
    
    if [ "$INSTALL_MODE" = "docker" ]; then
        echo "  1. Review Docker Compose configuration in docker/ directory"
        echo "  2. Start services using Docker Compose"
        echo "  3. Check logs for service status"
    else
        echo "  1. Configure your environment variables"
        echo "  2. Start MongoDB and Redis services"
        echo "  3. Run: npm run start_development_server"
    fi
    
    echo ""
    info "Documentation: https://docs.talawa.io"
    echo ""
}

main
