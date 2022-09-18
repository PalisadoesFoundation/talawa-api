// const GroupChat = require('../../models/GroupChat');
// const GroupChatMessage = require('../../models/GroupChatMessage');
const adminCheck = require('../functions/adminCheck');
const organizationExists = require('../../helper_functions/organizationExists');
const { tenantCtx } = require('../../helper_functions');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

// admins of the organization can remove chats -- may change in the future

module.exports = async (parent, args, context) => {
  const { id: chatId, db } = await tenantCtx(args.chatId);
  const { GroupChat, GroupChatMessage } = db;
  const chat = await GroupChat.findById(chatId);
  if (!chat) {
    throw new NotFoundError(
      requestContext.translate('chat.notFound'),
      'chat.notFound',
      'chat'
    );
  }

  const org = await organizationExists(chat.organization);

  adminCheck(context, org);

  // delete all messages in the chat
  await GroupChatMessage.deleteMany({
    _id: {
      $in: [...chat.messages],
    },
  });

  await GroupChat.deleteOne({ _id: chatId });

  chat._doc._id = args.chatId;
  return chat;
};
