#!/bin/bash

# Purpose: Required for a cron job to reset the database on a cloud instance every 24 hours
# This script uses docker exec command to drop the specified MongoDB database,
# then runs a command to import sample data using npm.

# Specify the MongoDB container name
MONGO_CONTAINER_NAME="talawa-api_mongodb_1"

# Specify the MongoDB database name
MONGO_DATABASE_NAME="talawa-api"

# Use docker exec command to drop the specified MongoDB database
docker exec -it "$MONGO_CONTAINER_NAME" mongosh --eval "db.getSiblingDB('$MONGO_DATABASE_NAME').dropDatabase()"

# Changing to repo dir
cd /home/talawa-api/develop/talawa-api

# Run a command to import sample data using npm
npm run import:sample-data

