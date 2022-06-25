const { USER_NOT_AUTHORIZED, USER_NOT_FOUND } = require('../../../constants');
const userExists = require('../../helper_functions/userExists');
const User = require('../../models/User');

const acceptAdmin = async (parent, args, context) => {
  const { id } = args;

  const isSuperAdmin = await userExists(context.userId);

  if (isSuperAdmin.userType !== 'SUPERADMIN') {
    throw new Error(USER_NOT_AUTHORIZED);
  }

  let userFound = await userExists(id);
  if (!userFound) throw new Error(USER_NOT_FOUND);

  const isUpdated = await User.findByIdAndUpdate(
    { _id: id },
    { adminApproved: true }
  );

  if (isUpdated) {
    return true;
  }

  return false;
};

const rejectAdmin = async (parent, args, context) => {
  const { id } = args;

  const isSuperAdmin = await userExists(context.userId);

  if (isSuperAdmin.userType !== 'SUPERADMIN') {
    throw new Error(USER_NOT_AUTHORIZED);
  }

  let userFound = await userExists(id);
  if (!userFound) throw new Error(USER_NOT_FOUND);

  const isRemoved = await User.findByIdAndDelete({ _id: id });

  if (isRemoved) {
    return true;
  }

  return false;
};

module.exports = { acceptAdmin, rejectAdmin };
