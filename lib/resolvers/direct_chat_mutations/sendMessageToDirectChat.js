const DirectChat = require('../../models/DirectChat');
const DirectChatMessage = require('../../models/DirectChatMessage');
const userExists = require('../../helper_functions/userExists');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  NOT_FOUND_CHAT_CODE,
  NOT_FOUND_CHAT_PARAM,
  NOT_FOUND_CHAT_MESSAGE,
  NOT_FOUND_DIRECT_CHATS_TEST,
} = require('../../../constants');

module.exports = async (parent, args, context) => {
  const chat = await DirectChat.findById(args.chatId);
  if (!chat) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
        ? NOT_FOUND_DIRECT_CHATS_TEST
        : requestContext.translate(NOT_FOUND_CHAT_MESSAGE),
      NOT_FOUND_CHAT_CODE,
      NOT_FOUND_CHAT_PARAM
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
      _id: args.chatId,
    },
    {
      $set: {
        messages: [...chat._doc.messages, message],
      },
    }
  );

  //calls subscription
  context.pubsub.publish('MESSAGE_SENT_TO_DIRECT_CHAT', {
    messageSentToDirectChat: message._doc,
  });

  return message._doc;
};
