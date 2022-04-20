///Resolver to find direct chats messages by User ID.

const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const DirectChatMessages = require('../../models/DirectChatMessage');

module.exports = async (parent, args) => {
  const directChatsMessagesFound = await DirectChatMessages.find({
    directChatMessageBelongsTo: args.id,
  });
  if (directChatsMessagesFound.length === 0) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
        ? 'DirectChats not found'
        : requestContext.translate('directChats.notFound'),
      'directChats.notFound',
      'directChats'
    );
  }
  return directChatsMessagesFound;
};
