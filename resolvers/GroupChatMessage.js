const User = require("../models/User");
const GroupChatMessage = require("../models/GroupChatMessage");
const Organization = require("../models/Organization");
const GroupChat = require("../models/GroupChat");

module.exports = {
  groupChatMessageBelongsTo: async (parent, args, context, info) => {
    return await GroupChat.findById(parent.groupChatMessageBelongsTo);
  },
  sender: async (parent, args, context, info) => {
    return await User.findById(parent.sender);
  }
};
