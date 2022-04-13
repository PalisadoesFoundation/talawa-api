const User = require('../../models/User');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const {
  NOT_FOUND_USER_CODE,
  NOT_FOUND_USER_MESSAGE,
  NOT_FOUND_USER_PARAM,
  NOT_FOUND_USER_TEST,
} = require('../../../constants');

module.exports = async (parent, args) => {
  const user = await User.findOne({
    _id: args.userId,
  });

  if (!user) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
        ? NOT_FOUND_USER_TEST
        : requestContext.translate(NOT_FOUND_USER_MESSAGE),
      NOT_FOUND_USER_CODE,
      NOT_FOUND_USER_PARAM
    );
  }

  return user.appLanguageCode;
};
