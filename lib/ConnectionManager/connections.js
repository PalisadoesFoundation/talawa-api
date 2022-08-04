const connections = {};

const setConnection = (orgId, connection) => {
  connections[`${orgId}`] = connection;
};

const getConnection = (orgId) => {
  if (!connections[orgId]) return null;
  return connections[orgId];
};

const destroy = async () => {
  for (let conn in connections) {
    await connections[conn].disconnect();
    delete connections[conn];
  }
};

module.exports = { setConnection, getConnection, destroy };
