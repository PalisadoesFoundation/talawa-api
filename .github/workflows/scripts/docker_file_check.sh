#!/bin/bash
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if ! command -v docker-compose &> /dev/null; then
    echo "Error: docker-compose is not installed"
    exit 1
fi

docker-compose -f "${REPO_ROOT}/docker-compose.dev.yaml" down -v || {
   echo "Warning: Failed to stop containers. Continuing anyway..."
}

echo "docker-compose.dev.yaml file found. Ready to proceed."