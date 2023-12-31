#!/bin/bash

cd ~/develop 
cd talawa-api
git checkout develop
git pull origin
docker-compose down
docker-compose up -d --build

# Set permissions to 700 for the script
chmod 700 "$0"

# Set ownership to talawa-api user
chown talawa-api "$0"
