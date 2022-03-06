const DirectChat = require('../../models/DirectChat');
const DirectChatMessage = require('../../models/DirectChatMessage');
const userExists = require('../../helper_functions/userExists');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

module.exports = async (parent, args, context) => {
  const chat = await DirectChat.findById(args.chatId);
  if (!chat) {
    throw new NotFoundError(
      requestContext.translate('chat.notFound'),
      'chat.notFound',
      'chat'
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
    messageSentToDirectChat: {
      ...message._doc,
    },
  });

  return message._doc;
};
