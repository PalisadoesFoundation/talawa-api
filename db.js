
const mongoose = require("mongoose");

const mongoURL = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URL}/${process.env.TEST_DB || process.env.MONGO_DB}?retryWrites=true&w=majority`;



const connect = mongoose
.connect(
  mongoURL,
  
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
)


module.exports = connect