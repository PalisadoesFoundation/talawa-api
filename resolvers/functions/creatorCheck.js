const { Unauthorized } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');

const creatorCheck = (context, org) => {
  const isCreator = String(org.creator) === context.userId;
  if (!isCreator) {
    throw new Unauthorized([
      {
        message: requestContext.translate('user.notAuthorized'),
        code: 'user.notAuthorized',
        param: 'userAuthorization',
      },
    ]);
  }
};

module.exports = creatorCheck;
