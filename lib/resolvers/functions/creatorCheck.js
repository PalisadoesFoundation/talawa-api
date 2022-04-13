const { UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  NOT_AUTHORIZED_USER_CODE,
  NOT_AUTHORIZED_USER_PARAM,
  NOT_AUTHORIZED_USER_MESSAGE,
  NOT_AUTHORIZED_USER_TEST,
} = require('../../../constants');

const creatorCheck = (context, org) => {
  const isCreator = String(org.creator) === context.userId;
  if (!isCreator) {
    throw new UnauthorizedError(
      process.env.NODE_ENV !== 'production'
        ? NOT_AUTHORIZED_USER_TEST
        : requestContext.translate(NOT_AUTHORIZED_USER_MESSAGE),
      NOT_AUTHORIZED_USER_CODE,
      NOT_AUTHORIZED_USER_PARAM
    );
  }
};

module.exports = creatorCheck;
