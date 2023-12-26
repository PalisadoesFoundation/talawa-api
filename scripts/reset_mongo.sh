#!/bin/bash

# Set the name of your MongoDB container
MONGO_CONTAINER_NAME="talawa-api-mongodb-1"

# Set the name of your MongoDB database
MONGO_DATABASE_NAME="talawa-api"

# Uses docker exec command to drop the database
docker exec -it "$MONGO_CONTAINER_NAME" mongosh --eval "db.getSiblingDB('$MONGO_DATABASE_NAME').dropDatabase()"

chmod +x "$0"