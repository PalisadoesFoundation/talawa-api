const { User, DirectChat } = require('../models');

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
