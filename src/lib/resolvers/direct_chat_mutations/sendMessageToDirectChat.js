const { DirectChat, DirectChatMessage } = require('../../models');
const { userExists } = require('../../utilities');
const { NotFoundError } = require('../../libraries/errors');
const requestContext = require('../../libraries/request-context');
const {
  IN_PRODUCTION,
  CHAT_NOT_FOUND,
  CHAT_NOT_FOUND_MESSAGE,
  CHAT_NOT_FOUND_CODE,
  CHAT_NOT_FOUND_PARAM,
} = require('../../../constants');

module.exports = async (parent, args, context) => {
  const chat = await DirectChat.findById(args.chatId);
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
