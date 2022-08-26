const { getConnection } = require('./connections');

module.exports = (organizationId) => {
  return getConnection(organizationId);
};
