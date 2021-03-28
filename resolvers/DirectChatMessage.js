const User = require('../models/User');
const DirectChat = require('../models/DirectChat');

module.exports = {
  directChatMessageBelongsTo: async (parent) => {
    return await DirectChat.findById(parent.directChatMessageBelongsTo);
  },
  sender: async (parent) => {
    return await User.findById(parent.sender);
  },
  receiver: async (parent) => {
    return await User.findById(parent.receiver);
  },
};
