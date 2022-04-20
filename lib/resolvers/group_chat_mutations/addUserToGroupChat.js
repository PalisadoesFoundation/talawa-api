const User = require('../../models/User');
const GroupChat = require('../../models/GroupChat');
const adminCheck = require('../functions/adminCheck');
const organizationExists = require('../../helper_functions/organizationExists');
const { NotFoundError, ConflictError } = require('errors');
const requestContext = require('talawa-request-context');

module.exports = async (parent, args, context) => {
  let chat = await GroupChat.findById(args.chatId);
  if (!chat) {
    throw new NotFoundError(
      requestContext.translate('chat.notFound'),
      'chat.notFound',
      'chat'
    );
  }

  const org = await organizationExists(chat.organization);

  adminCheck(context, org); // only an admin can add new users to the group chat -- may change in the future

  const userBeingAdded = await User.findById(args.userId);

  // ensure user isnt already a member
  const userAlreadyAMember = chat._doc.users.filter(
    (user) => user === args.userId
  );
  if (userAlreadyAMember.length > 0) {
    throw new ConflictError(
      requestContext.translate('user.alreadyMember'),
      'user.alreadyMember',
      'userAlreadyMember'
    );
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
