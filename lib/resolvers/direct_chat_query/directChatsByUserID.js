///Resolver to find direct chats by User ID.

const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const DirectChat = require('../../models/DirectChat');

module.exports = async (parent, args) => {
  const directChatsFound = await DirectChat.find({ users: args.id });
  if (!directChatsFound) {
    throw new NotFoundError(
      requestContext.translate('directChats.notFound'),
      'directChats.notFound',
      'directChats'
    );
  }
  return directChatsFound;
};
