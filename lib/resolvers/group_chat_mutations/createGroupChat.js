const User = require('../../models/User');
// const GroupChat = require('../../models/GroupChat');
const { getTenantConnection } = require('../../ConnectionManager');
const { addTenantId } = require('../../helper_functions');
const Organization = require('../../models/Organization');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

module.exports = async (parent, args, context) => {
  const userFound = await User.findOne({ _id: context.userId });
  if (!userFound) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  const org = await Organization.findOne({ _id: args.data.organizationId });
  if (!org) {
    throw new NotFoundError(
      requestContext.translate('organization.notFound'),
      'organization.notFound',
      'organization'
    );
  }

  const usersInChat = [];

  // add users to cat
  for await (const userId of args.data.userIds) {
    const user = await await User.findOne({ _id: userId });
    if (!user) {
      throw new NotFoundError(
        requestContext.translate('user.notFound'),
        'user.notFound',
        'user'
      );
    }
    usersInChat.push(user);
  }

  const { GroupChat } = await getTenantConnection(args.data.organizationId);
  let groupChat = new GroupChat({
    creator: userFound,
    users: usersInChat,
    organization: org,
    title: args.data.title,
  });

  groupChat = await groupChat.save();
  groupChat._doc._id = addTenantId(
    groupChat._doc._id,
    args.data.organizationId
  );
  return groupChat._doc;
};
