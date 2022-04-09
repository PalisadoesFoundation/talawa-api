const database = require('../../db');

module.exports = async () => {
  // Disconnects the database instance accessible within the http server.
  await database.disconnect();

  // Closes the http server after all the tests have completed.
  globalThis.serverConnection.close();
};
