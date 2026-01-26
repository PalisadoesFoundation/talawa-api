#!/bin/sh
set -eu

echo "[devcontainer] Starting post-create setup..."

# --------------------------------------------------------------------
# Preflight: required base tools
# --------------------------------------------------------------------
for cmd in fnm corepack; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "[ERROR] Required command '$cmd' is not installed." >&2
    exit 1
  fi
done

# --------------------------------------------------------------------
# Node.js setup via fnm (non-interactive)
# --------------------------------------------------------------------
eval "$(fnm env)"
fnm install
fnm use

# --------------------------------------------------------------------
# Corepack + pnpm (STRICTLY NON-INTERACTIVE)
# --------------------------------------------------------------------
echo "[devcontainer] Enabling corepack..."
corepack enable

# IMPORTANT: Explicit activation using package.json version
PNPM_VERSION="$(node -p "require('./package.json').packageManager.split('@')[1]")"

echo "[devcontainer] Activating pnpm@${PNPM_VERSION}..."
corepack prepare "pnpm@${PNPM_VERSION}" --activate

# Verify pnpm is usable WITHOUT triggering prompt
pnpm --version

# --------------------------------------------------------------------
# Workspace directories
# --------------------------------------------------------------------
mkdir -p .pnpm-store node_modules

# --------------------------------------------------------------------
# Permissions (fail fast)
# --------------------------------------------------------------------
if [ ! -w ".pnpm-store" ] || [ ! -w "node_modules" ]; then
  if ! sudo -n chown -R "$(id -u):$(id -g)" .pnpm-store node_modules; then
    echo "[ERROR] Failed to fix pnpm directory permissions." >&2
    exit 1
  fi
fi

# --------------------------------------------------------------------
# Install dependencies
# --------------------------------------------------------------------
echo "[devcontainer] Installing dependencies..."
pnpm install

echo "[devcontainer] Post-create setup complete."
