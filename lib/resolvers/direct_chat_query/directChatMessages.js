const DirectChatMessages = require('../../models/DirectChatMessage');

module.exports = async () => {
  return await DirectChatMessages.find();
};
