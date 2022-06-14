///Resolver to find direct chats by User ID.

const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const DirectChat = require('../../models/DirectChat');

module.exports = async (parent, args) => {
  const directChatsFound = await DirectChat.find({ users: args.id });

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
