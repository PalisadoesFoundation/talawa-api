const { UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');

const adminCheck = (context, org) => {
  const isAdmin = org.admins.includes(context.userId);

  if (!isAdmin) {
    throw new UnauthorizedError(
      process.env.NODE_ENV !== 'production'
        ? 'User not authorized'
        : requestContext.translate('user.notAuthorized'),
      'user.notAuthorized',
      'userAuthorization'
    );
  }
};

module.exports = adminCheck;
