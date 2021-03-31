const User = require('../models/User');
const GroupChat = require('../models/GroupChat');

module.exports = {
  groupChatMessageBelongsTo: async (parent) => {
    return await GroupChat.findById(parent.groupChatMessageBelongsTo);
  },
  sender: async (parent) => {
    return await User.findById(parent.sender);
  },
};
