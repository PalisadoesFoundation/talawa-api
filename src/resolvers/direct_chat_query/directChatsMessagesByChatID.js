///Resolver to find direct chats messages by User ID.

const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const DirectChatMessages = require('../../models/DirectChatMessage');

module.exports = async (parent, args) => {
  const directChatsMessagesFound = await DirectChatMessages.find({
    directChatMessageBelongsTo: args.id,
  });
  if (!directChatsMessagesFound) {
    throw new NotFoundError(
      requestContext.translate('directChatsMessage.notFound'),
      'directChatsMessage.notFound',
      'directChatsMessage'
    );
  }
  return directChatsMessagesFound;
};
