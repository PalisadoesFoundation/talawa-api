const { Unauthenticated } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');

const authCheck = (context) => {
  if (context.expired)
    throw new Unauthenticated([
      {
        message: requestContext.translate('user.notAuthenticated'),
        code: 'user.notAuthenticated',
        param: 'userAuthentication',
      },
    ]);
  if (!context.isAuth) {
    throw new Unauthenticated([
      {
        message: requestContext.translate('user.notAuthenticated'),
        code: 'user.notAuthenticated',
        param: 'userAuthentication',
      },
    ]);
  }
};

module.exports = authCheck;
