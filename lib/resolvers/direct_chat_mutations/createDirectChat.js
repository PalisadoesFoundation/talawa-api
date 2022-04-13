const User = require('../../models/User');
const DirectChat = require('../../models/DirectChat');
const Organization = require('../../models/Organization');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  NOT_FOUND_ORGANIZATION_CODE,
  NOT_FOUND_ORGANIZATION_MESSAGE,
  NOT_FOUND_ORGANIZATION_PARAM,
  NOT_FOUND_USER_CODE,
  NOT_FOUND_USER_MESSAGE,
  NOT_FOUND_USER_PARAM,
} = require('../../../constants');

module.exports = async (parent, args, context) => {
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_USER_MESSAGE),
      NOT_FOUND_USER_CODE,
      NOT_FOUND_USER_PARAM
    );
  }

  const org = await Organization.findOne({ _id: args.data.organizationId });
  if (!org) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_ORGANIZATION_MESSAGE),
      NOT_FOUND_ORGANIZATION_CODE,
      NOT_FOUND_ORGANIZATION_PARAM
    );
  }

  const usersInChat = [];

  // add users to cat
  for await (const userId of args.data.userIds) {
    const user = await await User.findOne({ _id: userId });
    if (!user) {
      throw new NotFoundError(
        requestContext.translate(NOT_FOUND_USER_MESSAGE),
        NOT_FOUND_USER_CODE,
        NOT_FOUND_USER_PARAM
      );
    }
    usersInChat.push(user);
  }

  let directChat = new DirectChat({
    creator: user,
    users: usersInChat,
    organization: org,
  });

  directChat = await directChat.save();

  return directChat._doc;
};
