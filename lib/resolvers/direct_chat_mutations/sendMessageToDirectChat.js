// const DirectChat = require('../../models/DirectChat');
// const DirectChatMessage = require('../../models/DirectChatMessage');
const { tenantCtx, addTenantId } = require('../../helper_functions');
const userExists = require('../../helper_functions/userExists');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  IN_PRODUCTION,
  CHAT_NOT_FOUND,
  CHAT_NOT_FOUND_MESSAGE,
  CHAT_NOT_FOUND_CODE,
  CHAT_NOT_FOUND_PARAM,
} = require('../../../constants');
module.exports = async (parent, args, context) => {
  const { db, id: chatId, tenantId } = await tenantCtx(args.chatId);

  const { DirectChat, DirectChatMessage } = db;
  const chat = await DirectChat.findById(chatId);
  if (!chat) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? CHAT_NOT_FOUND
        : requestContext.translate(CHAT_NOT_FOUND_MESSAGE),
      CHAT_NOT_FOUND_CODE,
      CHAT_NOT_FOUND_PARAM
    );
  }

  const sender = await userExists(context.userId);

  const receiver = chat.users.filter((u) => u.toString() !== sender.id);

  const message = new DirectChatMessage({
    directChatMessageBelongsTo: chat._doc,
    sender: sender._id,
    receiver: receiver,
    createdAt: new Date(),
    messageContent: args.messageContent,
  });

  await message.save();

  // add message to chat
  await DirectChat.updateOne(
    {
      _id: chatId,
    },
    {
      $set: {
        messages: [...chat._doc.messages, message],
      },
    }
  );

  message._doc._id = addTenantId(message._doc._id, tenantId);
  //calls subscription
  context.pubsub.publish('MESSAGE_SENT_TO_DIRECT_CHAT', {
    messageSentToDirectChat: message._doc,
  });

  return message._doc;
};
