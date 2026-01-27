#!/usr/bin/env bash
set -eu -o pipefail

echo "[devcontainer] Starting post-create setup..."

# --------------------------------------------------------------------
# Preflight: required base tools
# --------------------------------------------------------------------
for cmd in fnm corepack node; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "[ERROR] Required command '$cmd' is not installed." >&2
    exit 1
  fi
done

# --------------------------------------------------------------------
# Node.js setup via fnm (non-interactive)
# --------------------------------------------------------------------
# fnm env outputs shell code; eval is required
eval "$(fnm env)"
fnm install
fnm use

# --------------------------------------------------------------------
# Corepack + pnpm (STRICTLY NON-INTERACTIVE)
# --------------------------------------------------------------------
# These MUST be set BEFORE any corepack invocation
export CI=true
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

echo "[devcontainer] Enabling corepack..."
corepack enable

# --------------------------------------------------------------------
# Validate and extract pnpm version from package.json
# --------------------------------------------------------------------
PNPM_VERSION="$(node -e '
  const pkg = require("./package.json");
  const pm = pkg.packageManager;
  if (!pm || !pm.startsWith("pnpm@")) {
    console.error("[ERROR] package.json packageManager must be pnpm@<version>.");
    process.exit(1);
  }
  console.log(pm.split("@")[1]);
')"

echo "[devcontainer] Activating pnpm@${PNPM_VERSION}..."
corepack prepare "pnpm@${PNPM_VERSION}" --activate

# --------------------------------------------------------------------
# Verify pnpm is usable WITHOUT triggering a prompt
# --------------------------------------------------------------------
pnpm --version >/dev/null
echo "[devcontainer] pnpm is ready"

# --------------------------------------------------------------------
# Workspace directories
# --------------------------------------------------------------------
mkdir -p .pnpm-store node_modules

# --------------------------------------------------------------------
# Permissions (fail fast, non-interactive sudo)
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
pnpm install --frozen-lockfile

echo "[devcontainer] Post-create setup complete."
