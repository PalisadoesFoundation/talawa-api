const User = require('../../models/User');
const userExists = require('../../helper_functions/userExists');
const { USER_NOT_FOUND, USER_NOT_AUTHORIZED } = require('../../../constants');

module.exports = async (parent, args, context) => {
  const { id, userType } = args.data;

  const isSuperAdmin = await userExists(context.userId);

  if (isSuperAdmin.userType !== 'SUPERADMIN') {
    throw new Error(USER_NOT_AUTHORIZED);
  }

  let userFound = await userExists(id);
  if (!userFound) throw new Error(USER_NOT_FOUND);

  const isUpdated = await User.findByIdAndUpdate(
    { _id: id },
    { userType, adminApproved: true }
  );

  if (isUpdated) {
    return true;
  }

  return false;
};
