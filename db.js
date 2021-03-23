const mongoose = require("mongoose");

let mongoURI = "";

// choose appropriate db based on the NODE_ENV
const mongo_db =
  process.env.NODE_ENV === "test" ? process.env.TEST_DB : process.env.MONGO_DB;

if (process.env.MONGO_LOCAL_INSTANCE === "true") {
  if (process.env.LOCAL_DB_REQUIRES_AUTH === "true") {
    mongoURI = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@127.0.0.1:27017/${process.env.MONGO_DB}`;
  } else {
    mongoURI = `mongodb://127.0.0.1:27017/${mongo_db}`;
  }
} else {
  mongoURI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URL}/${mongo_db}?retryWrites=true&w=majority`;
}

const connect = async () => {
  try {
    await mongoose.connect(mongoURI, {
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useNewUrlParser: true,
    });
    console.log("MongoDB is connected");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
module.exports = connect;