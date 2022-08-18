const connections = require('./connections');

module.exports = async () => {
  await connections.destroy();
};
