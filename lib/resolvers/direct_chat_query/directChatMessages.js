const { getAllConnections } = require('../../ConnectionManager/connections');
const { addTenantId } = require('../../helper_functions');

module.exports = async () => {
  const directChatMessages = [];
  const connections = getAllConnections();
  for (let conn in connections) {
    const { DirectChatMessage } = connections[conn];
    const curMessages = await DirectChatMessage.find();
    for (let message of curMessages) {
      message._doc._id = addTenantId(message._doc._id, conn);
      directChatMessages.push(message);
    }
  }
  return directChatMessages;
};
