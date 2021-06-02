const GroupChat = require('../../models/GroupChat');
const GroupChatMessage = require('../../models/GroupChatMessage');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

// admins of the organization can remove chats -- may change in the future

module.exports = async (parent, args) => {
  const chat = await GroupChat.findById(args.chatId);
  if (!chat) {
    throw new NotFoundError(
      requestContext.translate('chat.notFound'),
      'chat.notFound',
      'chat'
    );
  }

  // delete all messages in the chat
  await GroupChatMessage.deleteMany({
    _id: {
      $in: [...chat.messages],
    },
  });

  await GroupChat.deleteOne({ _id: args.chatId });

  return chat;
};
