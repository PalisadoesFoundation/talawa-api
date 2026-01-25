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
fnm install
fnm use

# --------------------------------------------------------------------
# Corepack + pnpm (NON-INTERACTIVE, PINNED)
# Repo pins pnpm to 10.26.1 via packageManager
# --------------------------------------------------------------------
echo "[devcontainer] Enabling corepack..."
corepack enable

echo "[devcontainer] Activating pinned pnpm version (10.26.1)..."
corepack prepare pnpm@10.26.1 --activate

if ! command -v pnpm >/dev/null 2>&1; then
  echo "[ERROR] pnpm is not available after corepack setup." >&2
  exit 1
fi

pnpm --version

# --------------------------------------------------------------------
# Workspace directories
# --------------------------------------------------------------------
mkdir -p .pnpm-store node_modules

# --------------------------------------------------------------------
# Permissions (fail fast if broken)
# --------------------------------------------------------------------
if [ ! -w ".pnpm-store" ] || [ ! -w "node_modules" ]; then
  if ! sudo -n chown -R "$(id -u):$(id -g)" .pnpm-store node_modules; then
    echo "
[ERROR] Failed to fix permissions for pnpm directories.
Please ensure Docker volumes are writable by the container user.
" >&2
    exit 1
  fi
fi

# --------------------------------------------------------------------
# Install dependencies
# --------------------------------------------------------------------
echo "[devcontainer] Installing dependencies..."
pnpm install --frozen-lockfile

echo "[devcontainer] Post-create setup complete."
