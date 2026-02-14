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
if [ -s .nvmrc ]; then
  NODE_VERSION=$(tr -d '\r\n' < .nvmrc)
else
  NODE_VERSION="24.12.0"
fi
fnm install "$NODE_VERSION"
fnm use "$NODE_VERSION"
fnm default "$NODE_VERSION"
corepack prepare pnpm@10.28.1 --activate
pnpm install

# ============ VALIDATION CHECKS ============
# CI/CD will FAIL if any of these checks fail

echo "Running validation checks..."

# Check 1: Node.js is installed and correct version
if ! command -v node >/dev/null 2>&1; then
    echo "FAILED: Node.js is not installed"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2)
EXPECTED_NODE="24.12.0"
if [ "$NODE_VERSION" != "$EXPECTED_NODE" ]; then
    echo "FAILED: Node.js version is $NODE_VERSION, expected $EXPECTED_NODE"
    exit 1
fi
echo "Node.js $NODE_VERSION"

# Check 2: pnpm is installed and correct version
if ! command -v pnpm >/dev/null 2>&1; then
    echo "FAILED: pnpm is not installed"
    exit 1
fi

PNPM_VERSION=$(pnpm --version)
EXPECTED_PNPM="10.28.1"
if [ "$PNPM_VERSION" != "$EXPECTED_PNPM" ]; then
    echo "FAILED: pnpm version is $PNPM_VERSION, expected $EXPECTED_PNPM"
    exit 1
fi
echo "pnpm $PNPM_VERSION"

# Check 3: node_modules exists and is not empty
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
    echo "FAILED: node_modules is missing or empty"
    exit 1
fi
echo "node_modules is populated"

# Check 4: Critical dependency exists (graphql)
if [ ! -d "node_modules/graphql" ]; then
    echo "FAILED: graphql dependency is missing"
    exit 1
fi
echo "Graphql is installed"

echo "All validation checks passed! Devcontainer setup completed successfully."
