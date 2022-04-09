require('dotenv').config(); // pull env variables from .env file
const logger = require('logger');
const database = require('./db.js');
const { httpServer, apolloServer } = require('./server.js');

const serverStart = async () => {
  try {
    await database.connect();
    httpServer.listen(process.env.PORT || 4000, () => {
      logger.info(
        `🚀 Server ready at http://localhost:${process.env.PORT || 4000}${
          apolloServer.graphqlPath
        }`
      );
      logger.info(
        `🚀 Subscriptions ready at ws://localhost:${process.env.PORT || 4000}${
          apolloServer.subscriptionsPath
        }`
      );
    });
  } catch (e) {
    logger.error('Error while connecting to database', e);
  }
};

serverStart();
