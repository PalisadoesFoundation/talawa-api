const User = require('../models/User');
const GroupChat = require('../models/GroupChat');

module.exports = {
  groupChatMessageBelongsTo: async (parent) =>
    await GroupChat.findById(parent.groupChatMessageBelongsTo),
  sender: async (parent) => await User.findById(parent.sender),
};
