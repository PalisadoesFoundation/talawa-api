///Resolver to find direct chats by User ID.

const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const { tenantCtx, addTenantId } = require('../../helper_functions');

const User = require('../../models/User');

module.exports = async (parent, args) => {
  const user = await User.findOne({ _id: args.id });
  if (!user) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
        ? 'DirectChats not found'
        : requestContext.translate('directChats.notFound'),
      'directChats.notFound',
      'directChats'
    );
  }
  const directChatsFound = [];
  const orgs = {};
  for (let i = 0; i < user.directChats.length; i++) {
    const { tenantId, db } = await tenantCtx(user.directChats[i]);
    if (tenantId in orgs) continue;
    orgs[tenantId] = true;
    const { DirectChat } = db;
    const curChats = await DirectChat.find({ users: args.id });
    for (let i = 0; i < curChats.length; i++) {
      curChats[i]._doc._id = addTenantId(curChats[i]._doc._id, tenantId);
      directChatsFound.push(curChats[i]);
    }
  }

  if (directChatsFound.length === 0) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
        ? 'DirectChats not found'
        : requestContext.translate('directChats.notFound'),
      'directChats.notFound',
      'directChats'
    );
  }

  return directChatsFound;
};
