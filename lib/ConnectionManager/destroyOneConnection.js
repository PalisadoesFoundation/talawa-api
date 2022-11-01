const connections = require('./connections');

module.exports = async (orgId) => {
  return await connections.destroyOneConnection(orgId);
};
