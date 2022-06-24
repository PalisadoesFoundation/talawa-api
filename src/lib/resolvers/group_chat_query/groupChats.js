const { GroupChat } = require('../../models');

module.exports = async () => {
  return await GroupChat.find();
};
