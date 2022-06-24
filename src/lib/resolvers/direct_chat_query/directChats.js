const { DirectChat } = require('../../models');

module.exports = async () => {
  return await DirectChat.find();
};
