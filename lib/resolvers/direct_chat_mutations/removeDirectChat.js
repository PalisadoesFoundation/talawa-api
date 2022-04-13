const DirectChat = require('../../models/DirectChat');
const DirectChatMessage = require('../../models/DirectChatMessage');
const adminCheck = require('../functions/adminCheck');
const organizationExists = require('../../helper_functions/organizationExists');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  NOT_FOUND_CHAT_CODE,
  NOT_FOUND_CHAT_PARAM,
  NOT_FOUND_CHAT_MESSAGE,
} = require('../../../constants');

// admins of the organization can remove chats -- may change in the future

module.exports = async (parent, args, context) => {
  const org = await organizationExists(args.organizationId);

  const chat = await DirectChat.findById(args.chatId);
  if (!chat) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_CHAT_MESSAGE),
      NOT_FOUND_CHAT_CODE,
      NOT_FOUND_CHAT_PARAM
    );
  }

  adminCheck(context, org);

  // delete all messages in the chat
  await DirectChatMessage.deleteMany({
    _id: {
      $in: [...chat.messages],
    },
  });

  await DirectChat.deleteOne({ _id: args.chatId });

  return chat;
};
