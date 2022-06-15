const { UnauthorizedError } = require('../../helper_lib/errors');
const requestContext = require('../../helper_lib/request-context');
const {
  IN_PRODUCTION,
  USER_NOT_AUTHORIZED,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_PARAM,
} = require('../../../constants');

const adminCheck = (context, org) => {
  const isAdmin = org.admins.includes(context.userId);
  if (!isAdmin) {
    throw new UnauthorizedError(
      !IN_PRODUCTION
        ? USER_NOT_AUTHORIZED
        : requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
      USER_NOT_AUTHORIZED_CODE,
      USER_NOT_AUTHORIZED_PARAM
    );
  }
};

module.exports = adminCheck;
