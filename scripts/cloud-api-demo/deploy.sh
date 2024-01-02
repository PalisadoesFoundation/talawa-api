#!/bin/bash

# Purpose: Deploy containers to a cloud instance on every push
# This script contains the commands used by .github/workflows/deploy.yaml file.

# Navigate to the project directory
cd ~/develop/talawa-api

# Switch to the 'develop' branch
git checkout develop

# Pull the latest changes from the 'develop' branch on the origin
git pull origin

# Stop and remove existing containers
docker-compose down

# Build and launch containers in the background
docker-compose up -d --build
