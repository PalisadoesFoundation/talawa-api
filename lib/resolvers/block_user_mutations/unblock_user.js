const adminCheck = require('../functions/adminCheck');
const organizationExists = require('../../helper_functions/organizationExists');
const userExists = require('../../helper_functions/userExists');
const { UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');

module.exports = async (parent, args, context) => {
  // ensure org exists
  const org = await organizationExists(args.organizationId);

  // ensure user exists
  const user = await userExists(args.userId);

  // ensure user is admin
  adminCheck(context, org);

  // ensure user is blocked
  const blocked = org._doc.blockedUsers.filter(
    (blockedUser) => blockedUser.toString() === user.id
  );
  if (!blocked[0]) {
    throw new UnauthorizedError(
      process.env.NODE_ENV !== 'production'
        ? 'User not authorized'
        : requestContext.translate('user.notAuthorized'),
      'user.notAuthorized',
      'userAuthorization'
    );
  }

  // remove user from the  blockedUsers array inside the organization record.
  org.overwrite({
    ...org._doc,
    blockedUsers: org._doc.blockedUsers.filter(
      (blockedUser) => blockedUser.toString() !== user.id
    ),
  });
  await org.save();

  // remove the organization from the organizationsBlockedBy array inside the user record.
  user.overwrite({
    ...user._doc,
    organizationsBlockedBy: user._doc.organizationsBlockedBy.filter(
      (organization) => organization.toString() !== org.id
    ),
  });
  await user.save();

  return {
    ...user._doc,
    password: null,
  };
};
