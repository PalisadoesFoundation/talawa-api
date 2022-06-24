const { User, GroupChat } = require('../../models');
const adminCheck = require('../functions/adminCheck');
const { organizationExists } = require('../../helper_functions');
const { NotFoundError, ConflictError } = require('../../helper_lib/errors');
const requestContext = require('../../helper_lib/request-context');
const {
  IN_PRODUCTION,
  CHAT_NOT_FOUND,
  CHAT_NOT_FOUND_MESSAGE,
  CHAT_NOT_FOUND_CODE,
  CHAT_NOT_FOUND_PARAM,
  USER_ALREADY_MEMBER,
  USER_ALREADY_MEMBER_CODE,
  USER_ALREADY_MEMBER_MESSAGE,
  USER_ALREADY_MEMBER_PARAM,
} = require('../../../constants');

module.exports = async (parent, args, context) => {
  let chat = await GroupChat.findById(args.chatId);
  if (!chat) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? CHAT_NOT_FOUND
        : requestContext.translate(CHAT_NOT_FOUND_MESSAGE),
      CHAT_NOT_FOUND_CODE,
      CHAT_NOT_FOUND_PARAM
    );
  }

  const org = await organizationExists(chat.organization);

  adminCheck(context, org); // only an admin can add new users to the group chat -- may change in the future

  const userBeingAdded = await User.findById(args.userId);

  // ensure user isnt already a member
  const userAlreadyAMember = chat._doc.users.filter(
    (user) => user.toString() === args.userId.toString()
  );
  if (userAlreadyAMember.length > 0) {
    throw new ConflictError(
      !IN_PRODUCTION
        ? USER_ALREADY_MEMBER
        : requestContext.translate(USER_ALREADY_MEMBER_MESSAGE),
      USER_ALREADY_MEMBER_CODE,
      USER_ALREADY_MEMBER_PARAM
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
