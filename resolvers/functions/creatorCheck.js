const { UnauthorizedError } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');

const creatorCheck = (context, org) => {
  const isCreator = String(org.creator) === context.userId;
  if (!isCreator) {
    throw new UnauthorizedError(
      requestContext.translate('user.notAuthorized'),
      'user.notAuthorized',
      'userAuthorization'
    );
  }
};

module.exports = creatorCheck;
