#!/bin/bash
set -e

# Handle cleanup on script exit
cleanup() {
    echo "Shutting down MongoDB..."
    mongod --shutdown
    exit 0
}
trap cleanup SIGTERM SIGINT

mongod --replSet rs0 --bind_ip_all --dbpath /data/db &
MONGOD_PID=$!

# Wait for MongoDB to be ready
MAX_TRIES=30
COUNTER=0
echo "Waiting for MongoDB to start..."
until mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; do
    if [ $COUNTER -gt $MAX_TRIES ]; then
        echo "Error: MongoDB failed to start"
        exit 1
    fi
    let COUNTER=COUNTER+1
    sleep 1
done

# Initialize the replica set
mongosh --eval '
  config = {
    "_id" : "rs0",
    "members" : [
      {
        "_id" : 0,
        "host" : "mongo:27017",
        "priority": 1
      }
    ]
  };
  
  while (true) {
    try {
      rs.initiate(config);
      break;
    } catch (err) {
      print("Failed to initiate replica set, retrying in 5 seconds...");
      sleep(5000);
    }
  }
'

# Keep container running
wait $MONGOD_PID