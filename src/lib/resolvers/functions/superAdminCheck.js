const { UnauthorizedError } = require('../../helper_lib/errors');
const requestContext = require('../../helper_lib/request-context');

const superAdminCheck = (context, user) => {
  const isSuperAdmin = user.userType === 'SUPERADMIN';
  if (!isSuperAdmin) {
    throw new UnauthorizedError(
      process.env.NODE_ENV !== 'production'
        ? 'User is not authorized for performing this operation'
        : requestContext.translate('user.notAuthorized'),
      'user.notAuthorized',
      'userAuthorization'
    );
  }
};

module.exports = superAdminCheck;
