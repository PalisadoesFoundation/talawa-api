const User = require('../models/User');
const { tenantCtx } = require('../helper_functions');

module.exports = {
  groupChatMessageBelongsTo: async (parent) => {
    const { id: chatId, db } = await tenantCtx(
      parent.groupChatMessageBelongsTo
    );
    const { GroupChat } = db;
    return await GroupChat.findById(chatId);
  },
  sender: async (parent) => {
    return await User.findById(parent.sender);
  },
};
