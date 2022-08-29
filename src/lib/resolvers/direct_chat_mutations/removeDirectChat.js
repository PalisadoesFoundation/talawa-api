const { DirectChat, DirectChatMessage } = require('../../models');
const { adminCheck } = require('../../utilities');
const { organizationExists } = require('../../utilities/organizationExists');
const { NotFoundError } = require('../../libraries/errors');
const requestContext = require('../../libraries/request-context');

// admins of the organization can remove chats -- may change in the future

module.exports = async (parent, args, context) => {
  const org = await organizationExists(args.organizationId);

  const chat = await DirectChat.findById(args.chatId);
  if (!chat) {
    throw new NotFoundError(
      requestContext.translate('chat.notFound'),
      'chat.notFound',
      'chat'
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
