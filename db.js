const mongoose = require("mongoose");

//const mongoURL = `${process.env.MONGO_PREFIX}://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URL}/${process.env.TEST_DB || process.env.MONGO_DB}?retryWrites=true&w=majority`;

// const mongoURL = `${process.env.MONGO_PREFIX}://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URL}/${process.env.TEST_DB || process.env.MONGO_DB}?retryWrites=true&w=majority`;

// Use this connection string if you are using a hosted instance of mongodb using atlas
// const mongoURL = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@127.0.0.1:27017/${process.env.MONGO_DB}`

// Use this connection string if you are running mongodb locally

const mongoURL = `mongodb://127.0.0.1:27017/${process.env.MONGO_DB}`

const connect = async () => {
  try{
      await mongoose.connect(
          config.get('mongoURI'),
          {
              useCreateIndex: true,
              useUnifiedTopology: true,
              useFindAndModify: true,
              useNewUrlParser: true
          }
      )
      console.log("MongoDB is connected");
  } catch(error){
      console.log(error);
      process.exit(1);
  }
}

module.exports = connect;
