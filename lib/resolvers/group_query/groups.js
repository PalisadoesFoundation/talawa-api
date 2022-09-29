const { getAllConnections } = require('../../ConnectionManager/connections');
const { addTenantId } = require('../../helper_functions');

module.exports = async () => {
  const groups = [];
  const connections = getAllConnections();
  for (let conn in connections) {
    const { Group } = connections[conn];
    const curGroups = await Group.find();
    for (let group of curGroups) {
      group._doc._id = addTenantId(group._doc._id, conn);
      groups.push(group);
    }
  }
  return groups;
};
