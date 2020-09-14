const User = require("../models/User");
const DirectChatMessage = require("../models/DirectChatMessage");
const Organization = require("../models/Organization");



module.exports = {
  users: async (parent, args, context, info) => {
    return await User.find({
      _id: {
        $in: [...parent.users],
      },
    });
  },
  creator: async (parent, args, context, info) => {
    return await User.findById(parent.creator);
  },
  messages: async (parent, args, context, info) => {
    return DirectChatMessage.find({
      _id: {
        $in: [...parent.messages],
      },
    }); 
  },
  organization: async (parent, args, context, info) => {
    return await Organization.findById(parent.organization)
  }
};
