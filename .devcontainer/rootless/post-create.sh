#!/bin/sh
set -eu

# Rootless Docker post-create script
# When running as root in rootless Docker mode, we need to source the talawa user's fnm setup

# Source fnm from talawa user's installation
export PATH="/home/talawa/.local/share/fnm:$PATH"

# Preflight check for fnm (must run before eval to avoid hard failure)
if ! command -v fnm >/dev/null 2>&1; then
  echo "Error: Required command 'fnm' is not installed." >&2
  exit 1
fi

eval "$(fnm env --corepack-enabled --resolve-engines --use-on-cd --version-file-strategy=recursive)"

# Preflight check for corepack (pnpm checked after corepack enable)
if ! command -v corepack >/dev/null 2>&1; then
  echo "Error: Required command 'corepack' is not installed." >&2
  exit 1
fi

# Create directories if they don't exist
mkdir -p .pnpm-store node_modules

# Note: In rootless Docker mode running as root, permissions should already be correct
# because root inside container maps to the host user who owns the files

# Install node version and enable corepack (which provides pnpm)
fnm install
fnm use
corepack prepare pnpm@10.28.1 --activate

# Now check for pnpm (only available after corepack enable)
if ! command -v pnpm >/dev/null 2>&1; then
  echo "Error: Required command 'pnpm' is not installed after enabling corepack." >&2
  exit 1
fi

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