const userExists = require('../../helper_functions/userExists');

module.exports = async (parent, args, context) => {
  let userFound = await userExists(context.userId);
  if (!userFound) throw new Error('User not found');

  return {
    ...userFound?._doc,
    organizationsBlockedBy: [],
  };
};
