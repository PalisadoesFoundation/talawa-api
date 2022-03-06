const User = require('../models/User');
const DirectChatMessage = require('../models/DirectChatMessage');
const Organization = require('../models/Organization');

module.exports = {
  users: async (parent) =>
    await User.find({
      _id: {
        $in: [...parent.users],
      },
    }),
  creator: async (parent) => await User.findById(parent.creator),
  messages: async (parent) =>
    DirectChatMessage.find({
      _id: {
        $in: [...parent.messages],
      },
    }),
  organization: async (parent) =>
    await Organization.findById(parent.organization),
};
