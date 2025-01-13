#!/bin/sh
set -e

# Function to check and install jq
install_jq_if_missing() {
  echo "Checking if jq is installed..."
  if ! command -v jq >/dev/null 2>&1; then
    echo "jq is not installed."
    echo "Error: jq is required but not installed. Please install jq first:"
    echo "Alpine: apk add --no-cache jq"
    echo "Debian/Ubuntu: apt-get update && apt-get install -y jq"
    echo "RHEL/CentOS: yum install -y jq"
    echo "MacOS (with Homebrew): brew install jq"
    echo "Windows: Download jq from https://stedolan.github.io/jq/download/"
    exit 1
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
DEPS_FOLDER="./scripts/deps"
echo "Creating the $DEPS_FOLDER folder for storing dependency files..."
mkdir -p "$DEPS_FOLDER"

# Check if .env file exists and load it
if [ -f ".env" ]; then
  . ./.env
else
  echo "Warning: .env file not found"
fi

# Check if NODE_ENV is set
if [ -z "$NODE_ENV" ]; then
  echo "Warning: NODE_ENV is not set"
  NODE_ENV="development"  # Set default to development
fi

echo "Current NODE_ENV: $NODE_ENV"

# Check for production environment
if [ "$NODE_ENV" = "production" ]; then
  echo "Skipping npm install in production environment"
else
  echo "Installing dependencies (if necessary) to ensure npm ls commands run accurately..."
  npm install
fi

echo "Generating list of production dependencies (top-level only)..."
if ! npm ls --omit=dev --json > "$DEPS_FOLDER/prod-deps.json" 2>/dev/null; then
  echo "Warning: npm ls command produced errors, results may be incomplete"
fi

echo "Generating list of dev+prod dependencies (top-level only)..."
if ! npm ls --prod=false --json > "$DEPS_FOLDER/dev-deps.json" 2>/dev/null; then
  echo "Warning: npm ls command produced errors, results may be incomplete"
fi

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
