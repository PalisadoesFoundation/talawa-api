const { UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');
const { USER_NOT_AUTHORIZED } = require('../../../constants');

const creatorCheck = (context, org) => {
  const isCreator = String(org.creator) === context.userId;
  if (!isCreator) {
    throw new UnauthorizedError(
      process.env.NODE_ENV !== 'production'
        ? USER_NOT_AUTHORIZED
        : requestContext.translate('user.notAuthorized'),
      'user.notAuthorized',
      'userAuthorization'
    );
  }
};

module.exports = creatorCheck;
