//const { CONNECTION_NOT_FOUND } = require('../../constants');
//const { NotFoundError } = require('errors');
const Tenant = require('../../lib/models/Tenant');
const Database = require('../Database/index');

const connections = {};
const MainDB = require('../../lib/models');

const setConnection = (orgId, connection) => {
  connections[`${orgId}`] = connection;
};

const getConnection = async (orgId) => {
  if (!connections[orgId]) {
    // throw new NotFoundError(CONNECTION_NOT_FOUND);
    const [tenant] = await Tenant.find({ organization: orgId });
    if (!tenant || !tenant.url) {
      return MainDB;
    }
    let connection = new Database(tenant.url, {
      schema: !tenant.scheme || tenant.scheme.length === 0 ? [] : tenant.scheme,
    });
    await connection.connect();
    setConnection(tenant.organization, connection);
    return connection;
  }
  return connections[orgId];
};

const getAllConnections = () => {
  return connections;
};

const orgHasTenant = (orgId) => {
  if (connections[orgId]) return true;
  return false;
};

const destroy = async () => {
  for (let conn in connections) {
    await connections[conn].disconnect();
    delete connections[conn];
  }
};

const destroyOneConnection = async (orgId) => {
  if (!connections[orgId]) return false;
  await connections[orgId].disconnect();
  delete connections[orgId];
  return true;
};

module.exports = {
  setConnection,
  getConnection,
  destroy,
  getAllConnections,
  orgHasTenant,
  destroyOneConnection,
};
