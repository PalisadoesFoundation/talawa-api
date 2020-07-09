
const mongoose = require("mongoose");

const mongoURL = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@talawa-test-cluster-nk4oo.mongodb.net/${process.env.TEST_DB || process.env.MONGO_DB}?retryWrites=true&w=majority`;



const connect = mongoose
.connect(
  mongoURL,
  
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
)

module.exports = connect