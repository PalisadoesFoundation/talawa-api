#!/bin/bash

# Define the path to the .env file
COMPOSE_FILE="./.env"

# Set write permissions to ensure the script can modify the .env file
chmod 666 "$COMPOSE_FILE"

# Generate a random 32-character hex string using Node.js
RANDOM_TOKEN=$(node -e 'console.log([...Array(32)].map(()=>"0123456789abcdef"[Math.floor(Math.random()*16)]).join(""))')

# Ensure .env file exists
touch "$COMPOSE_FILE"

# Check if API_JWT_SECRET exists in the .env file
if grep -q "^API_JWT_SECRET=" "$COMPOSE_FILE"; then
    # Update the existing API_JWT_SECRET
    awk -v newval="$RANDOM_TOKEN" -F= 'BEGIN {OFS=FS} /^API_JWT_SECRET=/ {$2=newval} 1' "$COMPOSE_FILE" > temp.env && mv temp.env "$COMPOSE_FILE"
else
    # Append API_JWT_SECRET if it doesn't exist
    echo "API_JWT_SECRET=$RANDOM_TOKEN" >> "$COMPOSE_FILE"
fi

echo "✅ API_JWT_SECRET updated successfully!"
