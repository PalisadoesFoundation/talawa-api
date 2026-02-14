#!/bin/sh
set -eu

EXPECTED_NODE="24.12.0"
EXPECTED_PNPM="10.28.1"

echo "Running validation checks..."

# Check 1: Node.js is installed and correct version
if ! command -v node >/dev/null 2>&1; then
    echo "FAILED: Node.js is not installed"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2)
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