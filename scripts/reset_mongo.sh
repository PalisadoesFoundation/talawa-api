#!/bin/bash

MONGO_CONTAINER_NAME="talawa-api-mongodb-1"

MONGO_DATABASE_NAME="talawa-api"

# Uses docker exec command to drop the database
docker exec -it "$MONGO_CONTAINER_NAME" mongosh --eval "db.getSiblingDB('$MONGO_DATABASE_NAME').dropDatabase()"

npm run import:sample-data

chmod +x "$0"