#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "=========================================="
echo "Talawa-API Automated Installer (macOS)"
echo "=========================================="

# 1. Install System Dependencies (Git, JQ, Docker Desktop)
# Check for Homebrew
if ! command -v brew &> /dev/null; then
    echo "Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    if [ -f "/opt/homebrew/bin/brew" ]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
fi

echo "Installing Git and JQ..."
brew install git jq

# Install Docker Desktop if missing
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Installing Docker Desktop..."
    echo ""
    echo "=========================================="
    echo "Docker Desktop License Agreement"
    echo "=========================================="
    echo "This installer will download and install Docker Desktop."
    echo "By pressing Enter, you agree to Docker's Subscription Service Agreement."
    echo "License: https://www.docker.com/legal/docker-subscription-service-agreement"
    echo ""
    echo "Press [Enter] to accept and continue, or Ctrl+C to cancel..."
    read -r

    # Download Docker Desktop DMG (detect architecture)
    ARCH=$(uname -m)
    if [ "$ARCH" = "arm64" ]; then
        DOCKER_DMG_URL="https://desktop.docker.com/mac/main/arm64/Docker.dmg"
        echo "Detected Apple Silicon (ARM64)"
    else
        DOCKER_DMG_URL="https://desktop.docker.com/mac/main/amd64/Docker.dmg"
        echo "Detected Intel (AMD64)"
    fi
    echo "Downloading Docker Desktop..."
    curl -L -o /tmp/Docker.dmg "$DOCKER_DMG_URL"

    # Mount the DMG
    echo "Mounting Docker Desktop installer..."
    sudo hdiutil attach /tmp/Docker.dmg

    # Install with --accept-license flag
    echo "Installing Docker Desktop..."
    sudo /Volumes/Docker/Docker.app/Contents/MacOS/install --accept-license --user=$USER

    # Unmount DMG
    sudo hdiutil detach /Volumes/Docker

    # Clean up
    rm /tmp/Docker.dmg

    # Wait a moment for installation to complete
    sleep 3

    echo "Starting Docker Desktop..."
    if [ -d "/Applications/Docker.app" ]; then
        open -a /Applications/Docker.app
    else
        echo "Error: Docker Desktop was not installed to /Applications/Docker.app"
        exit 1
    fi

    echo "Waiting for Docker daemon to be ready..."
    DOCKER_TIMEOUT=120
    DOCKER_ELAPSED=0
    while ! docker info &> /dev/null; do
        if [ $DOCKER_ELAPSED -ge $DOCKER_TIMEOUT ]; then
            echo "Error: Docker daemon did not start within $DOCKER_TIMEOUT seconds."
            exit 1
        fi
        echo "  Waiting for Docker... ($DOCKER_ELAPSED/$DOCKER_TIMEOUT seconds)"
        sleep 5
        DOCKER_ELAPSED=$((DOCKER_ELAPSED + 5))
    done

    echo "✓ Docker Desktop is running!"
else
    echo "Docker is already installed."

    # Verify Docker daemon is running
    if ! docker info &> /dev/null; then
        echo "Docker daemon is not running. Starting Docker Desktop..."
        open -a Docker

        echo "Waiting for Docker daemon to be ready..."
        DOCKER_TIMEOUT=60
        DOCKER_ELAPSED=0
        while ! docker info &> /dev/null; do
            if [ $DOCKER_ELAPSED -ge $DOCKER_TIMEOUT ]; then
                echo "Error: Docker daemon did not start within $DOCKER_TIMEOUT seconds."
                exit 1
            fi
            echo "  Waiting for Docker... ($DOCKER_ELAPSED/$DOCKER_TIMEOUT seconds)"
            sleep 3
            DOCKER_ELAPSED=$((DOCKER_ELAPSED + 3))
        done
        echo "✓ Docker Desktop is running!"
    else
        echo "✓ Docker daemon is already running."
    fi
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

# Configure pnpm (setup global bin directory)
echo "Configuring pnpm..."
pnpm setup

# Add pnpm to PATH for current session
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
