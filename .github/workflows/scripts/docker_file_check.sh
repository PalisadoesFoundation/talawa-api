#!/bin/bash

echo "Stopping and removing any running containers..."
docker-compose -f ../../docker-compose.dev.yaml down -v || true

if [ ! -f "../../docker-compose.dev.yaml" ]; then
    echo "Error: docker-compose.dev.yaml not found"
    exit 1
fi

echo "docker-compose.dev.yaml file found. Ready to proceed."