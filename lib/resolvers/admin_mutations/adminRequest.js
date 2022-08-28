const { USER_NOT_AUTHORIZED } = require('../../../constants');
const userExists = require('../../helper_functions/userExists');
const User = require('../../models/User');

const acceptAdmin = async (parent, args, context) => {
  const { id } = args;

  const isSuperAdmin = await userExists(context.userId);

  if (isSuperAdmin.userType !== 'SUPERADMIN') {
    throw new Error(USER_NOT_AUTHORIZED);
  }

  await userExists(id);

  await User.findByIdAndUpdate({ _id: id }, { adminApproved: true });

  return true;
};

const rejectAdmin = async (parent, args, context) => {
  const { id } = args;

  const isSuperAdmin = await userExists(context.userId);

  if (isSuperAdmin.userType !== 'SUPERADMIN') {
    throw new Error(USER_NOT_AUTHORIZED);
  }

  await userExists(id);

  await User.findByIdAndDelete({ _id: id });

  return true;
};

module.exports = { acceptAdmin, rejectAdmin };
