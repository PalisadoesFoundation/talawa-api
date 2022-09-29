const { getAllConnections } = require('../../ConnectionManager/connections');
const { addTenantId } = require('../../helper_functions');

module.exports = async () => {
  const chats = [];
  const connections = getAllConnections();
  for (let conn in connections) {
    const { GroupChat } = connections[conn];
    const curChats = await GroupChat.find();
    for (let chat of curChats) {
      chat._doc._id = addTenantId(chat._doc._id, conn);
      chats.push(chat);
    }
  }
  return chats;
};
