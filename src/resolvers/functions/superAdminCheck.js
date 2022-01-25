const { UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');

const superAdminCheck = (context, user) => {
  const isSuperAdmin = user.userType === 'SUPERADMIN';
  if (!isSuperAdmin) {
    throw new UnauthorizedError(
      requestContext.translate('user.notAuthorized'),
      'user.notAuthorized',
      'userAuthorization'
    );
  }
};

module.exports = superAdminCheck;
