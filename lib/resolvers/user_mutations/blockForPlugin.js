const { NotFoundError } = require('errors');
const User = require('../../models/User');
const userExists = require('../../helper_functions/userExists');
const requestContext = require('talawa-request-context');
const superAdminCheck = require('../../resolvers/functions/superAdminCheck');

const {
  NOT_FOUND_USER_CODE,
  NOT_FOUND_USER_MESSAGE,
  NOT_FOUND_USER_PARAM,
} = require('../../../constants');

module.exports = async (parent, args, context) => {
  let userFound = await userExists(args.userId);
  if (!userFound) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_USER_MESSAGE),
      NOT_FOUND_USER_CODE,
      NOT_FOUND_USER_PARAM
    );
  }

  const user = await User.findOne({
    _id: context.userId,
  });

  if (!user) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_USER_MESSAGE),
      NOT_FOUND_USER_CODE,
      NOT_FOUND_USER_PARAM
    );
  }

  superAdminCheck(context, user);
  userFound.overwrite({
    ...userFound._doc,
    pluginCreationAllowed: !args.blockUser,
  });

  return userFound;
};
