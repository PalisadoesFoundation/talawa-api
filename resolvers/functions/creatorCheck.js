const { UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');

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
