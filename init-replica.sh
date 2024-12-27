#!/bin/bash
# init-replicaset.sh

mongod --replSet rs0 --dbpath /var/lib/mongodb --bind_ip_all &

# Wait for MongoDB to start
sleep 10

# Initialize the replica set
mongosh --eval '
  rs.initiate({
    _id: "rs0",
    members: [
      { _id: 0, host: "mongo:27017" }
    ]
  })
'

# Keep container running
tail -f /dev/null