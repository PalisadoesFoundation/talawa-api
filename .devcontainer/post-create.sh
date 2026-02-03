#!/bin/sh
set -eu

# Preflight checks
for cmd in fnm corepack pnpm; do
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
NODE_VERSION=$(cat .nvmrc 2>/dev/null || echo "24.12.0")
fnm install "$NODE_VERSION"
fnm use "$NODE_VERSION"
fnm default "$NODE_VERSION"
corepack enable
pnpm install
