#!/bin/bash

# Purpose: Required for a cron job to reset the database on a cloud instance every 24 hours
# This script uses docker exec command to drop the specified MongoDB database,
# then runs a command to import sample data using npm.

# Specify the MongoDB container name
MONGO_CONTAINER_NAME="talawa-api-mongodb-1"

# Specify the MongoDB database name
MONGO_DATABASE_NAME="talawa-api"

# Use docker exec command to drop the specified MongoDB database
docker exec -it "$MONGO_CONTAINER_NAME" mongosh --eval "db.getSiblingDB('$MONGO_DATABASE_NAME').dropDatabase()"

# Run a command to import sample data using npm
npm run import:sample-data

# Set permissions to 700 for the script
chmod 700 "$0"

# Set ownership to talawa-api user
chown talawa-api "$0"
