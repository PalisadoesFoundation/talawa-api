mongod --replSet rs0 --bind_ip_all --dbpath /data/db &

# Wait for MongoDB to start up
sleep 10

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
tail -f /dev/null