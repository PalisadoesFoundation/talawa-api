const mongoose = require("mongoose");

<<<<<<< HEAD
//const mongoURL = `${process.env.MONGO_PREFIX}://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URL}/${process.env.TEST_DB || process.env.MONGO_DB}?retryWrites=true&w=majority`;
=======
// const mongoURL = `${process.env.MONGO_PREFIX}://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URL}/${process.env.TEST_DB || process.env.MONGO_DB}?retryWrites=true&w=majority`;
>>>>>>> d04de9b609e07b52d293143a7518470c28694f00


const mongoURL = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@127.0.0.1:27017/${process.env.MONGO_DB}`

<<<<<<< HEAD
//const mongoURL = `mongodb://127.0.0.1:27017/${process.env.MONGO_DB}`
=======
const mongoURL = `mongodb://127.0.0.1:27017/${process.env.MONGO_DB}`
>>>>>>> d04de9b609e07b52d293143a7518470c28694f00

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