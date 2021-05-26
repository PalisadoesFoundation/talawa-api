const { UnauthenticatedError } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');

const authCheck = (context) => {
  if (context.expired)
    throw new UnauthenticatedError(
      requestContext.translate('user.notAuthenticated'),
      'user.notAuthenticated',
      'userAuthentication'
    );
  if (!context.isAuth) {
    throw new UnauthenticatedError(
      requestContext.translate('user.notAuthenticated'),
      'user.notAuthenticated',
      'userAuthentication'
    );
  }
};

module.exports = authCheck;
