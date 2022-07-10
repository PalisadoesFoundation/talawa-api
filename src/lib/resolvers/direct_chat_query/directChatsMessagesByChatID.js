///Resolver to find direct chats messages by User ID.
const { NotFoundError } = require('../../libraries/errors');
const requestContext = require('../../libraries/request-context');
const { DirectChatMessage } = require('../../models');
const {
  IN_PRODUCTION,
  CHAT_NOT_FOUND,
  CHAT_NOT_FOUND_MESSAGE,
  CHAT_NOT_FOUND_CODE,
  CHAT_NOT_FOUND_PARAM,
} = require('../../../constants');

module.exports = async (parent, args) => {
  const directChatsMessagesFound = await DirectChatMessage.find({
    directChatMessageBelongsTo: args.id,
  });
  if (directChatsMessagesFound.length === 0) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? CHAT_NOT_FOUND
        : requestContext.translate(CHAT_NOT_FOUND_MESSAGE),
      CHAT_NOT_FOUND_CODE,
      CHAT_NOT_FOUND_PARAM
    );
  }
  return directChatsMessagesFound;
};
