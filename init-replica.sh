#!/bin/bash
# init-replicaset.sh

mongod --replSet rs0 --dbpath /var/lib/mongodb --bind_ip_all &

until mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; do
  echo "Waiting for MongoDB to be ready..."
  sleep 2
done

if ! mongosh --eval '
  rs.initiate({
    _id: "rs0",
    members: [
      { _id: 0, host: "mongo:27017" }
    ]
  })' >/dev/null 2>&1; then
  echo "Failed to initialize replica set"
  exti 1
fi

until mongosh --eval 'rs.status().ok' | grep -q 1; do  
  echo "Waiting for replica set to be ready..." 
  sleep 2
done

tail -f /dev/null