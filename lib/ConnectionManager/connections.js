//const { CONNECTION_NOT_FOUND } = require('../../constants');
//const { NotFoundError } = require('errors');

const connections = {};
const MainDB = require('../../lib/models');

const setConnection = (orgId, connection) => {
  connections[`${orgId}`] = connection;
};

const getConnection = (orgId) => {
  if (!connections[orgId]) {
    console.log('not found');
    console.log(connections);
    // throw new NotFoundError(CONNECTION_NOT_FOUND);
    return MainDB;
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

module.exports = {
  setConnection,
  getConnection,
  destroy,
  getAllConnections,
  orgHasTenant,
};
