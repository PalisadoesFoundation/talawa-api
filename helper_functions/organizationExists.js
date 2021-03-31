const Organization = require('../models/Organization');

module.exports = async (id) => {
  const organization = await Organization.findOne({
    _id: id,
  });
  if (!organization) throw new Error('Organization not found');
  return organization;
};
