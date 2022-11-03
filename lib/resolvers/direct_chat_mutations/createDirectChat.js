const User = require('../../models/User');
const Organization = require('../../models/Organization');
const { getTenantConnection } = require('../../ConnectionManager');
const { addTenantId } = require('../../helper_functions');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

module.exports = async (parent, args, context) => {
  let user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
        ? 'User not found'
        : requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  const org = await Organization.findOne({ _id: args.data.organizationId });
  if (!org) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
        ? 'Organization not Found'
        : requestContext.translate('organization.notFound'),
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
        process.env.NODE_ENV !== 'production'
          ? 'User not found'
          : requestContext.translate('user.notFound'),
        'user.notFound',
        'user'
      );
    }
    usersInChat.push(user);
  }

  const { DirectChat } = await getTenantConnection(args.data.organizationId);
  let directChat = new DirectChat({
    creator: user,
    users: usersInChat,
    organization: org,
  });

  for (let userId of args.data.userIds) {
    await User.updateOne(
      {
        _id: userId,
      },
      {
        $push: {
          directChats: addTenantId(
            directChat._doc._id,
            args.data.organizationId
          ),
        },
      }
    );
  }

  directChat = await directChat.save();
  directChat._doc._id = addTenantId(
    directChat._doc._id,
    args.data.organizationId
  );
  return directChat.toObject();
};
