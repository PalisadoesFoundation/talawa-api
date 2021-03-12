const User = require('../models/User');
const DirectChat = require('../models/DirectChat');

module.exports = {
  directChatMessageBelongsTo: async (parent) =>
    await DirectChat.findById(parent.directChatMessageBelongsTo),
  sender: async (parent) => await User.findById(parent.sender),
  receiver: async (parent) => await User.findById(parent.receiver),
};
