// const DirectChat = require('../../models/DirectChat');
const { getAllConnections } = require('../../ConnectionManager/connections');
const { addTenantId } = require('../../helper_functions');

module.exports = async () => {
  const directChats = [];
  const connections = getAllConnections();
  for (let conn in connections) {
    const { DirectChat } = connections[conn];
    const curChats = await DirectChat.find();
    for (let chat of curChats) {
      chat._doc._id = addTenantId(chat._doc._id, conn);
      directChats.push(chat);
    }
  }
  return directChats;
};
