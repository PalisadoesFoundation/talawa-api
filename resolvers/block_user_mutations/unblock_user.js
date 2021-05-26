const authCheck = require('../functions/authCheck');
const adminCheck = require('../functions/adminCheck');
const organizationExists = require('../../helper_functions/organizationExists');
const userExists = require('../../helper_functions/userExists');
const { Unauthorized } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');

module.exports = async (parent, args, context) => {
  authCheck(context);

  // ensure org exists
  const org = await organizationExists(args.organizationId);

  // ensure user exists
  const user = await userExists(args.userId);

  // ensure user is admin
  adminCheck(context, org);

  // ensure user is blocked
  const blocked = org._doc.blockedUsers.filter(
    (blockedUser) => blockedUser === user.id
  );
  if (!blocked[0]) {
    throw new Unauthorized([
      {
        message: requestContext.translate('user.notAuthorized'),
        code: 'user.notAuthorized',
        param: 'userAuthorization',
      },
    ]);
  }

  // remove user from organizations blocked users field
  org.overwrite({
    ...org._doc,
    blockedUsers: org._doc.blockedUsers.filter(
      (blockedUser) => blockedUser !== user.id
    ),
  });
  await org.save();

  // add organization to users organizationsblockedbyfield
  user.overwrite({
    ...user._doc,
    organizationsBlockedBy: user._doc.organizationsBlockedBy.filter(
      (organization) => organization !== org.id
    ),
  });
  await user.save();

  return {
    ...user._doc,
    password: null,
  };
};
