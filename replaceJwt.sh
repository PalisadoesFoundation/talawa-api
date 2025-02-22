#!/bin/bash

# Define the path to the compose file
COMPOSE_FILE="./compose.yaml"

# Generate a random JWT-like token (modify this logic if needed)
RANDOM_TOKEN=$(openssl rand -base64 32 | tr -d '=+/')

# Replace placeholder with the generated token
sed -i "s/REPLACE_WITH_RANDOM_JWT_TOKEN/$RANDOM_TOKEN/g" "$COMPOSE_FILE"

echo "Token replaced successfully!"
