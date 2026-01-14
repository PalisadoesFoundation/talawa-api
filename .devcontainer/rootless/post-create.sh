#!/bin/sh
set -eu

# Rootless Docker post-create script
# When running as root in rootless Docker mode, we need to source the talawa user's fnm setup

# Source fnm from talawa user's installation
export PATH="/home/talawa/.local/share/fnm:$PATH"
eval "$(fnm env --corepack-enabled --resolve-engines --use-on-cd --version-file-strategy=recursive)"

# Preflight checks
for cmd in fnm corepack pnpm; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: Required command '$cmd' is not installed." >&2
    exit 1
  fi
done

# Create directories if they don't exist
mkdir -p .pnpm-store node_modules

# Note: In rootless Docker mode running as root, permissions should already be correct
# because root inside container maps to the host user who owns the files

# Install dependencies and tools
fnm install
fnm use
corepack enable
pnpm install
