///Resolver to find direct chats messages by User ID.

const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const { tenantCtx, addTenantId } = require('../../helper_functions');

const {
  IN_PRODUCTION,
  CHAT_NOT_FOUND,
  CHAT_NOT_FOUND_MESSAGE,
  CHAT_NOT_FOUND_CODE,
  CHAT_NOT_FOUND_PARAM,
} = require('../../../constants');

module.exports = async (parent, args) => {
  const { db, tenantId, id: chatId } = await tenantCtx(args.id);
  const { DirectChatMessage } = db;
  const directChatsMessagesFound = await DirectChatMessage.find({
    directChatMessageBelongsTo: chatId,
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
  for (let message of directChatsMessagesFound) {
    message._doc._id = addTenantId(message._doc._id, tenantId);
  }
  return directChatsMessagesFound;
};
