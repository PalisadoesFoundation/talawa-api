const mongoose = require('mongoose');
const logger = require('logger');

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB_URL, {
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useNewUrlParser: true,
    });
  } catch (error) {
    logger.error('Error while connecting to mongo database', error);
    process.exit(1);
  }
};

const disconnect = async () => {
  await mongoose.connection.close();
};
module.exports = { connect, disconnect };
