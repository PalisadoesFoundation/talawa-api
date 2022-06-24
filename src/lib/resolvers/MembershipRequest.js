const { User, Organization } = require('../models');

module.exports = {
  organization: async (parent) =>
    await Organization.findOne({ _id: parent.organization }),
  user: async (parent) => await User.findOne({ _id: parent.user }),
};
