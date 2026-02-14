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

# Read pnpm version from package.json
if [ -f "package.json" ]; then
  PNPM_VERSION=$(grep -o '"packageManager": *"pnpm@[^"]*"' package.json | sed 's/.*pnpm@\([^"]*\).*/\1/')
  if [ -z "$PNPM_VERSION" ]; then
    echo "Warning: Could not extract pnpm version from package.json, using default 10.28.1"
    PNPM_VERSION="10.28.1"
  fi
else
  echo "Warning: package.json not found, using default pnpm 10.28.1"
  PNPM_VERSION="10.28.1"
fi

# Install node version and enable corepack (which provides pnpm)
fnm install
fnm use
corepack prepare "pnpm@$PNPM_VERSION" --activate

# Now check for pnpm (only available after corepack enable)
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