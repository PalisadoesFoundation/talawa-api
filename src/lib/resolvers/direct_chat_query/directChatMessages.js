const { DirectChatMessage } = require('../../models');

module.exports = async () => {
  return await DirectChatMessage.find();
};
