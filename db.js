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

const dropAllCollections = async () => {
  // Get the current database connected to mongoose. Depends on the process
  // in which the above connect method is invoked and the MONGO_DB_URL env variable
  const database = mongoose.connection.db;

  // Gets the list of all collections in the currently associated database.
  // Maps over each collection to get a list of all collection names.
  // Then drops all the collections by their names that were returned from
  // the previous map function.
  await database.listCollections().toArray((error, collections) => {
    if (error) {
      console.log(error);
    } else {
      collections
        .map((collection) => collection.name)
        .forEach(async (collectionName) => {
          database.dropCollection(collectionName);
        });
    }
  });
};

module.exports = { connect, disconnect, dropAllCollections };
