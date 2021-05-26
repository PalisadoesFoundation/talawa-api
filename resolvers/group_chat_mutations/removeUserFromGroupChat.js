const GroupChat = require('../../models/GroupChat');
const authCheck = require('../functions/authCheck');
const adminCheck = require('../functions/adminCheck');
const organizationExists = require('../../helper_functions/organizationExists');
const { NotFoundError, UnauthorizedError } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');

module.exports = async (parent, args, context) => {
  authCheck(context);

  const chat = await GroupChat.findById(args.chatId);
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

  return await GroupChat.findOneAndUpdate(
    {
      _id: args.chatId,
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
};
