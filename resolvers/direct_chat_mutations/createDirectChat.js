const User = require('../../models/User');
const DirectChat = require('../../models/DirectChat');
const Organization = require('../../models/Organization');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

module.exports = async (parent, args, context) => {
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
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

  let directChat = new DirectChat({
    creator: user,
    users: usersInChat,
    organization: org,
  });

  directChat = await directChat.save();

  return directChat._doc;
};
