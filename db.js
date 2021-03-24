const mongoose = require('mongoose');

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB_URL, {
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useNewUrlParser: true,
    });
    console.log('MongoDB is connected');
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
module.exports = connect;
