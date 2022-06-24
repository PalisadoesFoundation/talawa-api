const { GroupChatMessage } = require('../../models');

module.exports = async () => {
  return await GroupChatMessage.find();
};
