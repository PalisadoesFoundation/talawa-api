#!/bin/sh
set -e

# Define the folder where dependency files are stored
DEPS_FOLDER="./scripts/deps"

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

# Allow configuration of source directory
SOURCE_DIR=${SOURCE_DIR:-"./src"}

for PACKAGE in $DEV_ONLY_PACKAGES; do
  echo "Checking if $PACKAGE is used in production..."
  
  # Use grep to check if the package name appears in the production code
  if grep -qr "$PACKAGE" "$SOURCE_DIR"; then
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

# Backup package.json
echo "Creating backup of package.json..."
cp package.json package.json.bak

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
