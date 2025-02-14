#!/bin/bash
set -e

# Generate new secrets
ACCESS_TOKEN_SECRET=$(openssl rand -hex 32)
REFRESH_TOKEN_SECRET=$(openssl rand -hex 32)

# Export them as environment variables
export ACCESS_TOKEN_SECRET
export REFRESH_TOKEN_SECRET

echo "Generated new ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET"

# Import sample data
echo "Importing sample data..."
npm run import:sample-data || {
    echo "Sample data import failed."
    exit 1
}
echo "Sample data import successful."

# Start the API server
npm run dev
