const Tenant = require('../models/Tenant');
const Database = require('../Database/index');
const { setConnection, getConnection } = require('./connections');

module.exports = async (organizationId) => {
  try {
    const alreadyConnected = getConnection(organizationId);
    if (alreadyConnected) return alreadyConnected;
    const [tenant] = await Tenant.find({ organization: organizationId });
    if (!tenant || !tenant.url) throw new Error('Organization not found!');
    console.log('tenant', tenant);
    let connection = new Database(tenant.url);
    await connection.connect();
    setConnection(tenant.organization, connection);
    return connection;
  } catch (e) {
    console.log('organization not found!');
  }
};
