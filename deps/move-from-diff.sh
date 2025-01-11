#!/bin/sh

# ==============================================
# README
# ==============================================
# This script analyzes the difference between production and development dependencies
# in a Node.js project. It identifies dev-only dependencies that are used in the
# production code and moves them from `devDependencies` to `dependencies` in the 
# project's `package.json` file.
#
# Purpose:
# - To ensure all required production dependencies are correctly categorized.
# - To prevent runtime errors in production due to missing dependencies.
#
# Prerequisites:
# 1. Ensure `analyze-dependencies.sh` has been run beforehand. This script generates:
#    - `prod-deps-keys.json`: Contains top-level production dependencies.
#    - `dev-deps-keys.json`: Contains top-level dev+prod dependencies.
#    These files must exist in the `deps` folder.
#
# 2. Ensure the script has execute permissions:
#    ```sh
#    chmod +x ./deps/move-from-diff.sh
#    ```
#
# 3. Ensure `jq` is installed on the system. If it is missing, install it using the 
#    appropriate package manager (e.g., `apt-get`, `yum`, or `apk`).
#
# Usage:
# 1. Navigate to the project root directory where `package.json` is located.
# 2. Execute this script:
#    ```sh
#    ./deps/move-from-diff.sh
#    ```
# 3. The script will:
#    - Analyze the diff between `prod-deps-keys.json` and `dev-deps-keys.json`.
#    - Identify dev-only dependencies used in production code.
#    - Move required dependencies from `devDependencies` to `dependencies`.
#
# Output:
# - Any required dependencies will be moved to `dependencies` in `package.json`.
# - A confirmation message will be displayed upon successful execution.
#
# Note:
# - Ensure your production code resides in `./src`, `./lib`, or `./app` folders.
# - Modify the script if your codebase structure differs.
# ==============================================

set -e

# Define the folder where dependency files are stored
DEPS_FOLDER="deps"

echo "Analyzing dependencies from diff output..."

# Check if the necessary files exist in the deps folder
if [ ! -f "$DEPS_FOLDER/prod-deps-keys.json" ] || [ ! -f "$DEPS_FOLDER/dev-deps-keys.json" ]; then
  echo "Error: prod-deps-keys.json or dev-deps-keys.json not found in the $DEPS_FOLDER folder. Run analyze-dependencies.sh first."
  exit 1
fi

# Generate the diff and extract dev-only packages
DIFF_OUTPUT=$(diff "$DEPS_FOLDER/prod-deps-keys.json" "$DEPS_FOLDER/dev-deps-keys.json" || true)
DEV_ONLY_PACKAGES=$(echo "$DIFF_OUTPUT" | grep '^>' | sed 's/^> //' | tr -d '",')

if [ -z "$DEV_ONLY_PACKAGES" ]; then
  echo "No dev-only dependencies found to check."
  exit 0
fi

echo "Found dev-only dependencies to check for production usage:"
echo "$DEV_ONLY_PACKAGES"

# Temporary file to store required production dependencies
REQUIRED_FOR_PRODUCTION_FILE=$(mktemp)

for PACKAGE in $DEV_ONLY_PACKAGES; do
  echo "Checking if $PACKAGE is used in production..."
  
  # Use grep to check if the package name appears in the production code
  if grep -qr "$PACKAGE" ./src; then
    echo "$PACKAGE is required in production."
    echo "$PACKAGE" >> "$REQUIRED_FOR_PRODUCTION_FILE"
  else
    echo "$PACKAGE is not used in production."
  fi
done

if [ ! -s "$REQUIRED_FOR_PRODUCTION_FILE" ]; then
  echo "No dev dependencies are required in production."
  rm -f "$REQUIRED_FOR_PRODUCTION_FILE"
  exit 0
fi

echo "The following dev dependencies are required in production:"
cat "$REQUIRED_FOR_PRODUCTION_FILE"

# Move required dependencies to production dependencies
while IFS= read -r PACKAGE; do
  echo "Moving $PACKAGE to dependencies..."

  # First, remove the package from devDependencies
   if ! npm uninstall "$PACKAGE" --save-dev; then
    echo "Error: Failed to uninstall $PACKAGE from devDependencies"
    exit 1
  fi
  # Install as a production dependency
  if ! npm install "$PACKAGE" --save-prod; then
    echo "Error: Failed to install $PACKAGE as production dependency"
    echo "Warning: Package is now removed from both devDependencies and dependencies"
    exit 1
  fi

done < "$REQUIRED_FOR_PRODUCTION_FILE"

# Clean up
rm -f "$REQUIRED_FOR_PRODUCTION_FILE"

echo "Required dev dependencies successfully moved to production dependencies."
