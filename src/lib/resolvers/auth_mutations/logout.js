const { User } = require('../../models');
const { NotFoundError } = require('../../libraries/errors');
const requestContext = require('../../libraries/request-context');
const {
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  USER_NOT_FOUND,
  IN_PRODUCTION,
} = require('../../../constants');

module.exports = async (parent, args, context) => {
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  user.token = null;

  await user.save();

  return true;
};
