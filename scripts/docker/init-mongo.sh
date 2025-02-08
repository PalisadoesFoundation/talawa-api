#!/bin/bash
set -e

echo "Starting MongoDB..."

container_id=$(hostname) 
echo "Container ID is: $container_id"

# Handle cleanup on script exit
cleanup() {
    echo "MongoDB container is shutting down..."
    mongod --shutdown || kill $MONGOD_PID
    exit 0
}
trap cleanup SIGTERM SIGINT EXIT

# Start MongoDB with replication enabled
echo "Starting MongoDB with replication..."
mongod --replSet rs0 --bind_ip_all --dbpath /data/db &
MONGOD_PID=$!

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to start..."
until mongosh --quiet --eval "db.adminCommand('ping')" >/dev/null 2>&1; do
    echo "Ping failed, retrying..."
    sleep 1
done
echo "MongoDB connection successful."

# Wait for PRIMARY status
timeout=60  # Increased timeout
start_time=$(date +%s)
while true; do
    if mongosh --quiet --eval "db.isMaster().ismaster" | grep -q "true"; then
        echo "Primary node elected."
        break
    fi

    current_time=$(date +%s)
    if (( current_time - start_time > timeout )); then
        echo "Primary election failed after $timeout seconds."
        exit 1
    fi

    sleep 1
done

# Check if replica set is already initialized
echo "Checking replica set initialization..."
if mongosh --quiet --eval "rs.status().ok" | grep -q "1"; then
    echo "Replica set already initialized."
else
    echo "Initializing replica set..."
    config='{
        _id: "rs0",
        members: [
            {
                _id: 0,
                host: "mongo:27017",
                priority: 2
            }
        ]
    }'

    retry_count=0
    max_retries=5
    while (( retry_count < max_retries )); do
        if mongosh --quiet --eval "rs.initiate($config)" | grep -q "ok"; then
            echo "Replica set initialized successfully."
            break
        else
            echo "Failed to initiate replica set, retrying in 5 seconds..."
            sleep 5
            ((retry_count++))
        fi
    done

    if (( retry_count == max_retries )); then
        echo "Replica set initialization failed after $max_retries attempts."
        exit 1
    fi
fi

# Final replica set status check
mongosh --quiet --eval 'rs.status()' || echo "Replica set status check failed"

# Keep the container running
wait $MONGOD_PID
