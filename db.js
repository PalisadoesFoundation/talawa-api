
const mongoose = require("mongoose");

const connect = mongoose
.connect(
  `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@ds023428.mlab.com:23428/${process.env.TEST_DB || process.env.MONGO_DB}`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
)

module.exports = connect