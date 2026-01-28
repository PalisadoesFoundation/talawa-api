#!/bin/bash

# Check external dependencies
# Required commands:
# - brew: Homebrew package manager (on macOS)
# - curl: For downloading files
# - command: Shell builtin
# Environment Variables:
# - OS_TYPE: 'macos' or 'linux' (from os-detection.sh)

set -euo pipefail

# scripts/install/common/package-manager.sh
# Shared package management functions

# Update package index
update_package_index() {
    if [[ "$OS_TYPE" == "macos" ]]; then
        info "Updating Homebrew..."
        brew update
    else
        return 0
    fi
}

# Check if a package is installed
# Arguments:
#   $1: package_name
is_package_installed() {
    local package="$1"
    if [[ "$OS_TYPE" == "macos" ]]; then
        if brew list --versions "$package" >/dev/null 2>&1; then
            return 0
        else
            return 1
        fi
    else
        # Fallback to command check
        if command -v "$package" >/dev/null 2>&1; then
            return 0
        else
            return 1
        fi
    fi
}

# Install a package
# Arguments:
#   $1: package_name
install_package() {
    local package="$1"
    if [[ "$OS_TYPE" == "macos" ]]; then
        info "Installing $package..."
        if brew install "$package"; then
            success "$package installed successfully"
        else
            error "Failed to install $package"
            return 1
        fi
    else
        warn "Package installation not supported for this OS in this script version."
        return 1
    fi
}
