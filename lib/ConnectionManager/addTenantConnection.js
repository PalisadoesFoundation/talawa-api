const Tenant = require('../models/Tenant');
const Database = require('../Database/index');
const { setConnection, getConnection } = require('./connections');

module.exports = async (organizationId) => {
  try {
    if (getConnection(organizationId)) return;
    const database = await Tenant.find({ organization: organizationId });
    if (!database) throw new Error('organization not found!');
    let connection = new Database(database.url);
    await connection.connect();
    setConnection(database.organization, connection);
    return connection;
  } catch (e) {
    console.log('organization not found!');
  }
};
