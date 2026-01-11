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
  if ! sudo -n chown -R talawa:talawa .pnpm-store node_modules; then
    echo "
[ERROR] 'chown' failed for .pnpm-store or node_modules.
Directories are not writable and sudo failed.
Please fix ownership permissions (e.g., via Docker Compose volumes) or run as root.
" >&2
    exit 1
  fi
fi

# Install dependencies and tools
fnm install
fnm use
corepack enable
pnpm install
