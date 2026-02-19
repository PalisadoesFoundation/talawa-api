#!/bin/sh
set -eu

# Preflight checks
for cmd in fnm corepack; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: Required command '$cmd' is not installed." >&2
    exit 1
  fi
done

# Create directories if they don't exist
mkdir -p .pnpm-store node_modules

# Fix permissions
# We check writability first to avoid unnecessary sudo usage.
# If chown fails on a non-writable directory, we fail fast to prevent hidden issues.
if [ ! -w ".pnpm-store" ] || [ ! -w "node_modules" ]; then
  # Use current user's UID:GID for ownership to ensure portability
  if ! sudo -n chown -R "$(id -u):$(id -g)" .pnpm-store node_modules; then
    echo "
[ERROR] 'chown' failed for .pnpm-store or node_modules.
Directories are not writable and sudo failed to change ownership to $(id -u):$(id -g).
Please fix ownership permissions via Docker Compose volumes options or ensure
the container user has write access.
" >&2
    exit 1
  fi
fi

# Install dependencies and tools
# Use explicit version to avoid "default" version errors in CI
if [ -s .nvmrc ]; then
  NODE_VERSION=$(tr -d '\r\n' < .nvmrc)
else
  NODE_VERSION="24.12.0"
fi
fnm install "$NODE_VERSION"
fnm use "$NODE_VERSION"
fnm default "$NODE_VERSION"
corepack prepare pnpm@10.28.1 --activate

# Check pnpm is available after corepack activation
if ! command -v pnpm >/dev/null 2>&1; then
  echo "Error: Required command 'pnpm' is not installed after enabling corepack." >&2
  exit 1
fi

pnpm install

# Add a small pause to ensure file system consistency
sleep 2

# Source validation checks
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
. "$SCRIPT_DIR/../validate-setup.sh"