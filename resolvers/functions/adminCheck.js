const { Unauthorized } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');

const adminCheck = (context, org) => {
  const isAdmin = org.admins.includes(context.userId);
  if (!isAdmin) {
    throw new Unauthorized([
      {
        message: requestContext.translate('user.notAuthorized'),
        code: 'user.notAuthorized',
        param: 'userAuthorization',
      },
    ]);
  }
};

module.exports = adminCheck;
