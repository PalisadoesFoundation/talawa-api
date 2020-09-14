const User = require("../models/User");
const DirectChatMessage = require("../models/DirectChatMessage");
const Organization = require("../models/Organization");
const DirectChat = require("../models/DirectChat");

module.exports = {
  directChatMessageBelongsTo: async (parent, args, context, info) => {
    return await DirectChat.findById(parent.directChatMessageBelongsTo);
  },
  sender: async (parent, args, context, info) => {
    return await User.findById(parent.sender);
  },
  receiver: async (parent, args, context, info) => {
    return await User.findById(parent.receiver);
  }
};
