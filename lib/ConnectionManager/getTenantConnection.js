const { getConnection } = require('./connections');

module.exports = async (organizationId) => {
  return await getConnection(organizationId);
};
