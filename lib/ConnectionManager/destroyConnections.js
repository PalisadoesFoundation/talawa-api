const connections = require('./connections');

module.exports = async () => {
  try {
    await connections.destroy();
  } catch (e) {
    console.log(e);
  }
};
