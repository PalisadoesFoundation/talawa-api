const Tenant = require('../models/Tenant');

module.exports = async (orgId) => {
  const tenant = await Tenant.find({ organization: orgId });
  return tenant;
};
