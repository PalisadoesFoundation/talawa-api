const Group = require('../../models/Group');

module.exports = async () => {
  return await Group.find();
};
