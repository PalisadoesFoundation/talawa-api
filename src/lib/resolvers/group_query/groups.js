const { Group } = require('../../models');

module.exports = async () => {
  return await Group.find();
};
