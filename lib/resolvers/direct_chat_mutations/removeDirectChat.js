// const DirectChat = require('../../models/DirectChat');
const User = require('../../models/User');
const { tenantCtx } = require('../../helper_functions');
const adminCheck = require('../functions/adminCheck');
const organizationExists = require('../../helper_functions/organizationExists');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

// admins of the organization can remove chats -- may change in the future

module.exports = async (parent, args, context) => {
  const org = await organizationExists(args.organizationId);

  const { db, id: chatId } = await tenantCtx(args.chatId);
  const { DirectChat, DirectChatMessage } = db;
  const chat = await DirectChat.findById(chatId);
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
  await User.updateMany(
    {
      directChats: chatId,
    },
    {
      $pull: {
        directChats: args.chatId,
      },
    }
  );

  await DirectChat.deleteOne({ _id: chatId });

  chat._doc._id = args.chatId;
  return chat._doc;
};
