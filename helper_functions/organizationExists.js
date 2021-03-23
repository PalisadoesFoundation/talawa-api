const Organization = require("../models/Organization");

module.exports = async (id) => {
  const organization = await Organization.findOne({
    _id: id,
  });
  if (!organization) throw Apperror("Organization not found");
  return organization;
};
