const { NotFoundError } = require('errors');
const User = require('../../models/User');
const userExists = require('../../helper_functions/userExists');
const requestContext = require("../../helper_lib/talawa-request-context/talawa-request-context");
const superAdminCheck = require('../../resolvers/functions/superAdminCheck');
const i18n = require('i18n');
const express = require('express');

const app = express();


const blockforPlugin = async (parent, args, context) => {
  app.use(i18n.init);
  let userFound = await userExists(args.userId);
  if (!userFound) {
    throw new NotFoundError(
      // requestContext.translate('user.notFound'),
      process.env.NODE_ENV !== 'production'
        ? 'User not found'
        : requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  const user = await User.findOne({
    _id: context.userId,
  });

  if (!user) {
    throw new NotFoundError(
      // requestContext.translate('user.notFound'),
      process.env.NODE_ENV !== 'production'
        ? 'User not found'
        : requestContext.translate('user.notFound'),
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

module.exports = blockforPlugin