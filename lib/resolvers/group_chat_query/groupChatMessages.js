const GroupChatMessages = require('../../models/GroupChatMessage');

module.exports = async () => {
  return await GroupChatMessages.find();
};
