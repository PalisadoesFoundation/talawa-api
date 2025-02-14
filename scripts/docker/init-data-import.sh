#!/bin/bash
set -e

# Generate new secrets
ACCESS_TOKEN_SECRET=$(openssl rand -hex 32)
REFRESH_TOKEN_SECRET=$(openssl rand -hex 32)
MINIO_ROOT_USER="admin"
MINIO_ROOT_PASSWORD=$(openssl rand -hex 16)  # Generate a strong random password

# Export them as environment variables
export ACCESS_TOKEN_SECRET
export REFRESH_TOKEN_SECRET
export MINIO_ROOT_USER
export MINIO_ROOT_PASSWORD

echo "Generated new ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET"
echo "Generated new MINIO_ROOT_USER and MINIO_ROOT_PASSWORD"

# Import sample data
echo "Importing sample data..."
npm run import:sample-data || {
    echo "Sample data import failed."
    exit 1
}
echo "Sample data import successful."

# Start the API server
npm run dev
