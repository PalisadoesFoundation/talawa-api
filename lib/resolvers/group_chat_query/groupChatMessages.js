// const GroupChatMessages = require('../../models/GroupChatMessage');
const { getAllConnections } = require('../../ConnectionManager/connections');
const { addTenantId } = require('../../helper_functions');

module.exports = async () => {
  const groupChatMessages = [];
  const connections = getAllConnections();
  for (let conn in connections) {
    const { GroupChatMessage } = connections[conn];
    const curMessages = await GroupChatMessage.find();
    for (let message of curMessages) {
      message._doc._id = addTenantId(message._doc._id, conn);
      groupChatMessages.push(message);
    }
  }
  return groupChatMessages;
};
