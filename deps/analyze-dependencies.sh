#!/bin/sh

# ==============================================
# README
# ==============================================
# This script analyzes the difference between production and development dependencies
# in a Node.js project. It generates files containing top-level dependencies for both
# production-only and all dependencies (production + development) using `npm ls` and `jq`.
# The results are saved in a `deps` folder, and a comparison is performed to identify
# differences between the two sets of dependencies.
#
# Purpose:
# - To identify dev-only and prod-only dependencies.
# - To provide insight into potential misclassified dependencies.
#
# Prerequisites:
# 1. Ensure `jq` is installed on your system. If not installed, the script will attempt
#    to install it using your system's package manager (`apk`, `apt-get`, or `yum`).
#
# 2. Ensure the script has execute permissions:
#    ```sh
#    chmod +x ./deps/analyze-dependencies.sh
#    ```
#
# 3. Ensure `npm` is installed and properly set up in the current environment.
#
# Usage:
# 1. Navigate to the root of your Node.js project where `package.json` is located.
# 2. Run the script:
#    ```sh
#    ./deps/analyze-dependencies.sh
#    ```
# 3. The script will:
#    - Generate files for production and dev+prod dependencies in the `deps` folder.
#    - Sort and compare the dependency lists for differences.
#
# Output:
# - The following files will be created in the `deps` folder:
#   - `prod-deps.json`: Top-level production dependencies.
#   - `dev-deps.json`: Top-level dev+prod dependencies.
#   - `prod-deps-keys.json`: Keys of production dependencies.
#   - `dev-deps-keys.json`: Keys of dev+prod dependencies.
# - A `diff` will be displayed showing the differences between production and dev dependencies.
#
# Notes:
# - Modify the script if your codebase structure differs or if additional processing is required.
# ==============================================

set -e

# Function to check and install jq
install_jq_if_missing() {
  echo "Checking if jq is installed..."
  if ! command -v jq >/dev/null 2>&1; then
    echo "jq is not installed. Installing jq..."
    if [ -x "$(command -v apk)" ]; then
      apk add --no-cache jq
    elif [ -x "$(command -v apt-get)" ]; then
      apt-get update && apt-get install -y jq
    elif [ -x "$(command -v yum)" ]; then
      yum install -y jq
    else
      echo "Error: Could not determine package manager to install jq."
      exit 1
    fi
    echo "jq installed successfully."
  else
    echo "jq is already installed."
  fi
}

# Run the jq installation check
install_jq_if_missing

echo "Checking if package.json exists..."
if [ ! -f "package.json" ]; then
  echo "Error: No package.json found in the current directory."
  exit 1
fi

# Create the deps folder if it does not exist
DEPS_FOLDER="deps"
echo "Creating the $DEPS_FOLDER folder for storing dependency files..."
mkdir -p "$DEPS_FOLDER"

echo "Installing dependencies (if necessary) to ensure npm ls commands run accurately..."
npm install

echo "Generating list of production dependencies (top-level only)..."
npm ls --omit=dev --json > "$DEPS_FOLDER/prod-deps.json"

echo "Generating list of dev+prod dependencies (top-level only)..."
npm ls --prod=false --json > "$DEPS_FOLDER/dev-deps.json"

# Extract just the top-level dependencies' keys. If a key is absent, we fall back to an empty object "{}".
echo "Extracting top-level dependencies from prod-deps.json..."
jq '.dependencies? // {} | keys' "$DEPS_FOLDER/prod-deps.json" > "$DEPS_FOLDER/prod-deps-keys.json"
echo "Extracting top-level dependencies from dev-deps.json..."
jq '.dependencies? // {} | keys' "$DEPS_FOLDER/dev-deps.json" > "$DEPS_FOLDER/dev-deps-keys.json"

# Sort them and compare side by side. We'll use textual diff to highlight any differences.
echo "Comparing top-level production vs. dev dependencies..."
sort "$DEPS_FOLDER/prod-deps-keys.json" -o "$DEPS_FOLDER/prod-deps-keys.json"
sort "$DEPS_FOLDER/dev-deps-keys.json" -o "$DEPS_FOLDER/dev-deps-keys.json"
diff "$DEPS_FOLDER/prod-deps-keys.json" "$DEPS_FOLDER/dev-deps-keys.json" || true

echo ""
echo "=========================================="
echo "Finished analyzing dependencies."
echo "$DEPS_FOLDER/prod-deps-keys.json: top-level prod deps."
echo "$DEPS_FOLDER/dev-deps-keys.json:  top-level dev+prod deps."
echo "Use 'diff $DEPS_FOLDER/prod-deps-keys.json $DEPS_FOLDER/dev-deps-keys.json' for side-by-side comparison."
