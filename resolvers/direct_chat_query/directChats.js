const DirectChat = require('../../models/DirectChat');

module.exports = async () => {
  return await DirectChat.find();
};
