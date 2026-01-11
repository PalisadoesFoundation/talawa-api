#!/bin/sh
set -e

# Create directories if they don't exist
mkdir -p .pnpm-store node_modules

# Fix permissions
if ! sudo -n chown -R talawa:talawa .pnpm-store node_modules 2>/dev/null; then
  echo "
[WARN] 'chown' failed for .pnpm-store or node_modules.
You may have permission issues. 
Try running: 'sudo chown -R $(whoami) .pnpm-store node_modules' manually or rebuild the container.
" >&2
  # We warn but don't exit failure on chown permission issues as it might be a bind mount limitation
fi

# Install dependencies and tools
fnm install
fnm use
corepack enable npm
corepack enable
corepack install
pnpm install
