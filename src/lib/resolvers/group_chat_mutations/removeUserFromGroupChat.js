const { GroupChat } = require('../../models');
const { adminCheck } = require('../../utilities');
const { organizationExists } = require('../../utilities');
const { NotFoundError, UnauthorizedError } = require('../../libraries/errors');
const requestContext = require('../../libraries/request-context');

module.exports = async (parent, args, context) => {
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
