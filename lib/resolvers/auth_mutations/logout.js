const User = require('../../models/User');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
} = require('../../../constants');

module.exports = async (parent, args, context) => {
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  user.token = null;

  await user.save();

  return true;
};
