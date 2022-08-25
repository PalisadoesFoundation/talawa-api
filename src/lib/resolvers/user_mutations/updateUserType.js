const { User } = require('../../models');
const { userExists } = require('../../utilities');
const { USER_NOT_AUTHORIZED } = require('../../../constants');

module.exports = async (parent, args, context) => {
  const { id, userType } = args.data;

  const isSuperAdmin = await userExists(context.userId);

  if (isSuperAdmin.userType !== 'SUPERADMIN') {
    throw new Error(USER_NOT_AUTHORIZED);
  }

  await userExists(id);

  await User.findByIdAndUpdate({ _id: id }, { userType, adminApproved: true });

  return true;
};
