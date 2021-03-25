const User = require('../models/User');
const Organization = require('../models/Organization');

module.exports = {
  organization: async (parent) =>
    await Organization.findOne({ _id: parent.organization }),
  user: async (parent) => await User.findOne({ _id: parent.user }),
};
