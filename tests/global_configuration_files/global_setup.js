const { httpServer } = require('../../server');
const database = require('../../db');

module.exports = async () => {
  // Makes the database accessible within the http server.
  await database.connect();

  // Drops(deletes) all the existing collections in our current test database to work
  // with a new clean database. This is done to make sure that each time tests are triggered they are
  // collision failsafe.
  await database.dropAllCollections();

  // Assigs a variable named serverConnection the current http server instance. This
  // variable can be used to have full control over our running http server against which our tests will
  // be running.
  globalThis.serverConnection = httpServer.listen(4000);
};
