const User = require("../models/User");
const GroupChatMessage = require("../models/GroupChatMessage");
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
    return GroupChatMessage.find({
      _id: {
        $in: [...parent.messages],
      },
    }); 
  },
  organization: async (parent, args, context, info) => {
    return await Organization.findById(parent.organization)
  }
};
