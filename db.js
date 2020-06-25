const mongoose = require("mongoose");

const connect = mongoose
.connect(
  //`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@talawa-dev-nk4oo.mongodb.net/${process.env.TEST_DB || process.env.MONGO_DB}?retryWrites=true&w=majority`,
  `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@talawa-test-cluster-nk4oo.mongodb.net/${process.env.TEST_DB || process.env.MONGO_DB}?retryWrites=true&w=majority`,()=>{},
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
)

module.exports = connect