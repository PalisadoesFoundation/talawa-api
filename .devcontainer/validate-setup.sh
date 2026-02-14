#!/bin/bash
set -eu

# retry function
retry() {
  local max_attempts=5
  local delay=2
  local attempt=1
  
  while [ $attempt -le $max_attempts ]; do
    "$@" && return 0
    if [ $attempt -lt $max_attempts ]; then
      echo "Retry $attempt/$max_attempts failed, waiting ${delay}s..."
      sleep $delay
      delay=$((delay * 2))
    fi
    attempt=$((attempt + 1))
  done
  
  echo "FAILED after $max_attempts attempts: $*"
  return 1
}

# Read Node version from .nvmrc
if [ -f ".nvmrc" ]; then
  EXPECTED_NODE=$(tr -d '\r\n' < .nvmrc)
else
  echo "WARNING: .nvmrc not found, using default 24.12.0"
  EXPECTED_NODE="24.12.0"
fi

# Read pnpm version from package.json packageManager field
if [ -f "package.json" ]; then
  # Using grep -o with pattern (more compatible than grep -P)
  EXPECTED_PNPM=$(grep -o '"packageManager": *"pnpm@[^"]*"' package.json | sed 's/.*pnpm@\([^"]*\).*/\1/')
  if [ -z "$EXPECTED_PNPM" ]; then
    echo "WARNING: Could not extract pnpm version from package.json, using default 10.28.1"
    EXPECTED_PNPM="10.28.1"
  fi
else
  echo "WARNING: package.json not found, using default pnpm 10.28.1"
  EXPECTED_PNPM="10.28.1"
fi

echo "Running validation checks..."
echo "Expected: Node.js $EXPECTED_NODE, pnpm $EXPECTED_PNPM"

# nodejs check
if ! command -v node >/dev/null 2>&1; then
    echo "FAILED: Node.js is not installed"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2)
if [ "$NODE_VERSION" != "$EXPECTED_NODE" ]; then
    echo "FAILED: Node.js version is $NODE_VERSION, expected $EXPECTED_NODE"
    exit 1
fi
echo "✓ Node.js $NODE_VERSION"

# pnpm check
if ! command -v pnpm >/dev/null 2>&1; then
    echo "FAILED: pnpm is not installed"
    exit 1
fi

PNPM_VERSION=$(pnpm --version)
if [ "$PNPM_VERSION" != "$EXPECTED_PNPM" ]; then
    echo "FAILED: pnpm version is $PNPM_VERSION, expected $EXPECTED_PNPM"
    exit 1
fi
echo "✓ pnpm $PNPM_VERSION"

check_node_modules() {
  # Check if directory exists and has contents
  if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
    return 1
  fi
  
  # Verify pnpm installation marker exists
  if [ ! -d "node_modules/.pnpm" ] && [ ! -f "node_modules/.modules.yaml" ]; then
    return 1
  fi
  
  return 0
}

if ! retry check_node_modules; then
    echo "FAILED: node_modules is missing, empty, or incomplete"
    exit 1
fi
echo "✓ node_modules is populated"

CRITICAL_DEPS="graphql fastify drizzle-orm"
for dep in $CRITICAL_DEPS; do
  if [ ! -d "node_modules/$dep" ]; then
    echo "FAILED: $dep dependency is missing"
    exit 1
  fi
done
echo "✓ Critical dependencies are installed (graphql, fastify, drizzle-orm)"

# Check if pnpm install was successful by verifying a common binary exists
if [ ! -f "node_modules/.bin/vitest" ] && [ ! -f "node_modules/.bin/tsx" ]; then
    echo "WARNING: No common binaries found in node_modules/.bin - install may be incomplete"
    # Don't exit, just warn
else
    echo "✓ node_modules binaries are available"
fi

echo "All validation checks passed! Devcontainer setup completed successfully."