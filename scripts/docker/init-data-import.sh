#!/bin/bash
set -e

# Import sample data
echo "Importing sample data..."
npm run import:sample-data || {
    echo "Sample data import failed."
    exit 1
}
echo "Sample data import successful."

# Start the API server
npm run dev
