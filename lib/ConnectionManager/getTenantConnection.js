const { getConnection } = require('./connections');

module.exports = (organizationId) => {
  try {
    return getConnection(organizationId);
  } catch (e) {
    console.log('organization not found!');
  }
};
