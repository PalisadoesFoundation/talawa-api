const Tenant = require('../models/Tenant');
const logger = require('logger');
const Database = require('../Database/index');
const { setConnection } = require('./connections');

module.exports = async () => {
  try {
    const databases = await Tenant.find();
    for (let db of databases) {
      let connection = new Database(db.url, { schema: db.scheme });
      await connection.connect();
      setConnection(db.organization, connection);
    }
  } catch (e) {
    logger.error('Error while connecting to mongo database', e);
  }
};
