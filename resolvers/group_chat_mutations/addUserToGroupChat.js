const User = require('../../models/User');
const GroupChat = require('../../models/GroupChat');
const authCheck = require('../functions/authCheck');
const adminCheck = require('../functions/adminCheck');
const organizationExists = require('../../helper_functions/organizationExists');
const { NotFound, ConflictError } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');

module.exports = async (parent, args, context) => {
  authCheck(context);

  let chat = await GroupChat.findById(args.chatId);
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

  const userBeingAdded = await User.findById(args.userId);

  // ensure user isnt already a member
  const userAlreadyAMember = chat._doc.users.filter(
    (user) => user === args.userId
  );
  if (userAlreadyAMember.length > 0) {
    throw new ConflictError([
      {
        message: requestContext.translate('user.alreadyMember'),
        code: 'user.alreadyMember',
        param: 'userAlreadyMember',
      },
    ]);
  }

  return await GroupChat.findOneAndUpdate(
    { _id: args.chatId },
    {
      $set: {
        users: [...chat._doc.users, userBeingAdded],
      },
    },
    {
      new: true,
    }
  );
};
