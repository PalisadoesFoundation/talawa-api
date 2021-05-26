const GroupChat = require('../../models/GroupChat');
const authCheck = require('../functions/authCheck');
const adminCheck = require('../functions/adminCheck');
const organizationExists = require('../../helper_functions/organizationExists');
const { NotFound, Unauthorized } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');

module.exports = async (parent, args, context) => {
  authCheck(context);

  const chat = await GroupChat.findById(args.chatId);
  if (!chat) {
    throw new NotFound([
      {
        message: requestContext.translate('chat.notFound'),
        code: 'chat.notFound',
        param: 'chat',
      },
    ]);
  }

  const org = await organizationExists(chat.organization);

  adminCheck(context, org); // only an admin can add new users to the group chat -- may change in the future

  // ensure user is already a member
  const userAlreadyAMember = chat._doc.users.filter(
    (user) => user === args.userId
  );
  if (!(userAlreadyAMember.length > 0)) {
    throw new Unauthorized([
      {
        message: requestContext.translate('user.notAuthorized'),
        code: 'user.notAuthorized',
        param: 'userAuthorization',
      },
    ]);
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
