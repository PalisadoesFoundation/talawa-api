const { CONNECTION_NOT_FOUND } = require('../../constants');
const { NotFoundError } = require('errors');

const connections = {};

const setConnection = (orgId, connection) => {
  connections[`${orgId}`] = connection;
};

const getConnection = (orgId) => {
  if (!connections[orgId]) {
    console.log('connections: ', connections);
    throw new NotFoundError(CONNECTION_NOT_FOUND);
  }
  return connections[orgId];
};

const getAllConnections = () => {
  return connections;
};

const destroy = async () => {
  for (let conn in connections) {
    await connections[conn].disconnect();
    delete connections[conn];
  }
};

module.exports = { setConnection, getConnection, destroy, getAllConnections };
