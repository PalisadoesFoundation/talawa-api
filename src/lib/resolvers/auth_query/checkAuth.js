const { userExists } = require('../../helper_functions/userExists');
const { USER_NOT_FOUND } = require('../../../constants');

module.exports = async (parent, args, context) => {
  let userFound = await userExists(context.userId);
  if (!userFound) throw new Error(USER_NOT_FOUND);

  return {
    ...userFound?._doc,
    organizationsBlockedBy: [],
  };
};
