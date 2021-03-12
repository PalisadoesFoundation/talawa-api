const mongoose = require("mongoose");
const config = require('config');

let mongoURI = "";

// choose appropriate db based on the NODE_ENV
const mongo_db = process.env.NODE_ENV === "test" ? process.env.TEST_DB : process.env.MONGO_DB;

if(process.env.MONGO_LOCAL_INSTANCE === "true"){
   mongoURI = `mongodb://127.0.0.1:27017/${mongo_db}`
}
else {
  mongoURI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URL}/${mongo_db}?retryWrites=true&w=majority`
}


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
module.exports = connect
