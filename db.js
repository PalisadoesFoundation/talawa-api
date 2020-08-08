const mongoose = require("mongoose");

const mongoURL = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@talawa-test-cluster-nk4oo.mongodb.net/${process.env.TEST_DB || process.env.MONGO_DB}?retryWrites=true&w=majority`;

//const mongoURL = `mongodb://talawa-admin:j7B9JtK8hY6gcBPf@127.0.0.1:27017/talawa-db`

const connect = mongoose
.connect(
  mongoURL,
  
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  }
)

module.exports = connect