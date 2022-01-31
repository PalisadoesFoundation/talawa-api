const GroupChat = require('../../models/GroupChat');

module.exports = async () => {
  return await GroupChat.find();
};
