const { tenantCtx } = require('../../helper_functions');
const adminCheck = require('../functions/adminCheck');
const organizationExists = require('../../helper_functions/organizationExists');
const { NotFoundError, UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');

module.exports = async (parent, args, context) => {
  const { id: chatId, db } = await tenantCtx(args.chatId);
  const { GroupChat } = db;
  const chat = await GroupChat.findById(chatId);
  if (!chat) {
    throw new NotFoundError(
      requestContext.translate('chat.notFound'),
      'chat.notFound',
      'chat'
    );
  }

  const org = await organizationExists(chat.organization);

  adminCheck(context, org); // only an admin can add new users to the group chat -- may change in the future

  // ensure user is already a member
  const userAlreadyAMember = chat._doc.users.filter(
    (user) => user === args.userId
  );
  if (!(userAlreadyAMember.length > 0)) {
    throw new UnauthorizedError(
      requestContext.translate('user.notAuthorized'),
      'user.notAuthorized',
      'userAuthorization'
    );
  }

  const groupChat = await GroupChat.findOneAndUpdate(
    {
      _id: chatId,
    },
    {
      $set: {
        users: chat._doc.users.filter((user) => user !== args.userId),
      },
    },
    {
      new: true,
    }
  );
  groupChat._doc._id = args.chatId;
  return groupChat._doc;
};
