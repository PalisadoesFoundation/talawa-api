const { User, GroupChat } = require('../models');

module.exports = {
  groupChatMessageBelongsTo: async (parent) => {
    return await GroupChat.findById(parent.groupChatMessageBelongsTo);
  },
  sender: async (parent) => {
    return await User.findById(parent.sender);
  },
};
