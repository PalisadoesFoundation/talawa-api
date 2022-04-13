const User = require('../../models/User');
const GroupChat = require('../../models/GroupChat');
const Organization = require('../../models/Organization');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const {
  NOT_FOUND_USER_MESSAGE,
  NOT_FOUND_USER_CODE,
  NOT_FOUND_USER_PARAM,
  NOT_FOUND_ORGANIZATION_CODE,
  NOT_FOUND_ORGANIZATION_MESSAGE,
  NOT_FOUND_ORGANIZATION_PARAM,
} = require('../../../constants');

module.exports = async (parent, args, context) => {
  const userFound = await User.findOne({ _id: context.userId });
  if (!userFound) {
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

  let groupChat = new GroupChat({
    creator: userFound,
    users: usersInChat,
    organization: org,
    title: args.data.title,
  });

  groupChat = await groupChat.save();

  return groupChat._doc;
};
