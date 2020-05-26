const Organization = require("../models/Organization");

const User = {
  createdOrganizations: async (parent, args, context, info) => {
    return await Organization.find({creator: parent._id});
  },
};

module.exports = User;
