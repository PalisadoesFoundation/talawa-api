/* eslint-disable indent */
const User = require('../../models/User');

module.exports = async (parent, args) => {
  await User.findOneAndUpdate(
    { _id: args.userId },
    {
      $inc: {
        tokenVersion: 1,
      },
    },
    {
      new: true,
    }
  );
  return true;
};
