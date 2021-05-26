const { UnauthorizedError } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');

const adminCheck = (context, org) => {
  const isAdmin = org.admins.includes(context.userId);
  if (!isAdmin) {
    throw new UnauthorizedError(
      requestContext.translate('user.notAuthorized'),
      'user.notAuthorized',
      'userAuthorization'
    );
  }
};

module.exports = adminCheck;
