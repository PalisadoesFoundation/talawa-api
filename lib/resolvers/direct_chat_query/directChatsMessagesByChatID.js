///Resolver to find direct chats messages by User ID.

const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const DirectChatMessages = require('../../models/DirectChatMessage');
const {
  NOT_FOUND_DIRECT_CHATS_CODE,
  NOT_FOUND_DIRECT_CHATS_PARAM,
  NOT_FOUND_DIRECT_CHATS_MESSAGE,
  NOT_FOUND_DIRECT_CHATS_TEST,
} = require('../../../constants');

module.exports = async (parent, args) => {
  const directChatsMessagesFound = await DirectChatMessages.find({
    directChatMessageBelongsTo: args.id,
  });
  if (directChatsMessagesFound.length === 0) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
        ? NOT_FOUND_DIRECT_CHATS_TEST
        : requestContext.translate(NOT_FOUND_DIRECT_CHATS_MESSAGE),
      NOT_FOUND_DIRECT_CHATS_CODE,
      NOT_FOUND_DIRECT_CHATS_PARAM
    );
  }
  return directChatsMessagesFound;
};
