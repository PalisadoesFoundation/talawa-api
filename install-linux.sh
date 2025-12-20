#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "=========================================="
echo "Talawa-API Automated Installer (Ubuntu)"
echo "=========================================="

# 1. Install System Dependencies (Git, JQ, Docker)
if [ -f /etc/debian_version ]; then
    echo "Updating package lists..."
    sudo apt-get update

    # Install basics
    echo "Installing Git, Curl, JQ, Unzip..."
    sudo apt-get install -y git curl jq unzip

    # Install Docker if missing
    if ! command -v docker &> /dev/null; then
        echo "Docker not found. Installing Docker..."
        curl -fsSL https://get.docker.com | sh

        echo "Adding current user to docker group..."
        sudo usermod -aG docker $USER
        echo "NOTE: Docker group added. The script will use 'sudo' for Docker commands."
        echo "      To use Docker without 'sudo' in future sessions, log out and back in."
    else
        echo "Docker is already installed."
    fi
else
    echo "Error: This script currently only supports Ubuntu/Debian."
    exit 1
fi

# 2. Install fnm (Fast Node Manager)
if ! command -v fnm &> /dev/null; then
    echo "Installing fnm..."
    curl -fsSL https://fnm.vercel.app/install | bash

    # Activate fnm for this session (without --use-on-cd to avoid auto-prompts)
    export PATH="$HOME/.local/share/fnm:$PATH"
    eval "$(fnm env)"
else
    echo "fnm is already installed."
    eval "$(fnm env)"
fi

# 3. Read Versions from package.json
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found in current directory."
    exit 1
fi

echo "Reading configuration from package.json..."
# Extract the full version number (e.g. "23.7.0" -> "23.7.0", ">=18.0.0" -> "18")
NODE_VERSION=$(jq -r '.engines.node // "lts"' package.json)
# If it starts with >= or ^, extract major version. Otherwise use full version
if [[ "$NODE_VERSION" =~ ^(\^|>=) ]]; then
    CLEAN_NODE_VERSION=$(echo "$NODE_VERSION" | grep -oE '[0-9]+' | head -1)
else
    CLEAN_NODE_VERSION="$NODE_VERSION"
fi

# Extract pnpm version (e.g. "pnpm@8.1.0" -> "8.1.0")
PNPM_FULL_STRING=$(jq -r '.packageManager' package.json)
if [[ "$PNPM_FULL_STRING" == pnpm@* ]]; then
    PNPM_VERSION=${PNPM_FULL_STRING#pnpm@}
else
    PNPM_VERSION="latest"
fi

echo "Target Node Version: $CLEAN_NODE_VERSION"
echo "Target pnpm Version: $PNPM_VERSION"

# 4. Install Node and pnpm
echo "Installing Node.js..."
fnm install $CLEAN_NODE_VERSION
fnm use $CLEAN_NODE_VERSION

echo "Installing pnpm..."
npm install -g "pnpm@$PNPM_VERSION"

# FORCEFULLY configure .bashrc (fixes the EC2 issue)
echo "Configuring pnpm path in .bashrc..."
SHELL_CONFIG="$HOME/.bashrc"

# Create the config lines
PNPM_BLOCK='
# pnpm
export PNPM_HOME="$HOME/.local/share/pnpm"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end
'

# Append to .bashrc only if not already there
if ! grep -q "PNPM_HOME" "$SHELL_CONFIG"; then
    echo "$PNPM_BLOCK" >> "$SHELL_CONFIG"
    echo "✅ Added pnpm to $SHELL_CONFIG"
else
    echo "ℹ️  pnpm already configured in $SHELL_CONFIG"
fi

# Apply to CURRENT script session so the rest of the script works
export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"

# 5. Install Project Dependencies
echo "Installing project dependencies..."
pnpm install

# 6. Run Setup Script
echo ""
echo "Select setup mode:"
echo "1) Local/Hybrid (databases in Docker, API on host)"
echo "2) RECOMMENDED: Docker/DevContainer (everything in Docker)"
read -p "Enter choice [1-2]: " SETUP_CHOICE

case $SETUP_CHOICE in
    1)
        echo "Running Local/Hybrid setup..."
        pnpm exec tsx src/install/setupLocal.ts
        ;;
    2)
        echo "Running Docker/DevContainer setup..."
        pnpm exec tsx src/install/setupDocker.ts
        ;;
    *)
        echo "Invalid choice. Defaulting to Local/Hybrid setup..."
        pnpm exec tsx src/install/setupLocal.ts
        ;;
esac

echo "=========================================="
echo "Installation Complete!"
echo "=========================================="

exec "$SHELL"
