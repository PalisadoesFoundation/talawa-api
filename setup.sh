#!/bin/bash

set -e

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Nix
install_nix() {
    echo "Nix is not installed. Installing Nix..."
    sh <(curl -L https://nixos.org/nix/install) --no-daemon
    . $HOME/.nix-profile/etc/profile.d/nix.sh
}

# Function to install Nix on macOS
install_nix_macos() {
    echo "Nix is not installed. Installing Nix..."
    sh <(curl -L https://nixos.org/nix/install) --no-daemon
    . $HOME/.nix-profile/etc/profile.d/nix.sh
}

# Function to handle different OS
install_nix_for_os() {
    OS=$(uname -s)
    case "$OS" in
        Linux*)
            install_nix
            ;;
        Darwin*)
            install_nix_macos
            ;;
        CYGWIN*|MINGW*|MSYS*)
            echo "Windows detected. Please use WSL (Windows Subsystem for Linux) to run this script."
            exit 1
            ;;
        *)
            echo "Unknown OS. Please install Nix manually."
            exit 1
            ;;
    esac
}

# Check if Nix is installed
if ! command_exists nix; then
    install_nix_for_os
else
    echo "Nix is already installed."
fi

# Ensure Nix environment is loaded
if [ -f "$HOME/.nix-profile/etc/profile.d/nix.sh" ]; then
    . $HOME/.nix-profile/etc/profile.d/nix.sh
elif [ -f "/nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh" ]; then
    . /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh
fi

# Run Nix flake
echo "Running Nix flake..."
nix develop

echo "Development environment is ready!"

