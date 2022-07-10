const { NotFoundError } = require('../../libraries/errors');
const { User } = require('../../models');
const { userExists } = require('../../utilities');
const requestContext = require('../../libraries/request-context');
const superAdminCheck = require('../../resolvers/functions/superAdminCheck');

module.exports = async (parent, args, context) => {
  let userFound = await userExists(args.userId);
  if (!userFound) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  const user = await User.findOne({
    _id: context.userId,
  });

  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  superAdminCheck(context, user);
  userFound.overwrite({
    ...userFound._doc,
    pluginCreationAllowed: !args.blockUser,
  });

  return userFound;
};
