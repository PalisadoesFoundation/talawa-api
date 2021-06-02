const User = require('../../models/User');
const GroupChat = require('../../models/GroupChat');
const { NotFoundError, ConflictError } = require('errors');
const requestContext = require('talawa-request-context');

module.exports = async (parent, args) => {
  let chat = await GroupChat.findById(args.chatId);
  if (!chat) {
    throw new NotFoundError(
      requestContext.translate('chat.notFound'),
      'chat.notFound',
      'chat'
    );
  }

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
