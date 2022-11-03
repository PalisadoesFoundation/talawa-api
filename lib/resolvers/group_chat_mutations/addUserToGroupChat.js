const User = require('../../models/User');
const { tenantCtx } = require('../../helper_functions');
const adminCheck = require('../functions/adminCheck');
const organizationExists = require('../../helper_functions/organizationExists');
const { NotFoundError, ConflictError } = require('errors');
const requestContext = require('talawa-request-context');
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
  const { id: chatId, db } = await tenantCtx(args.chatId);
  const { GroupChat } = db;
  let chat = await GroupChat.findById(chatId);
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

  const groupChat = await GroupChat.findOneAndUpdate(
    { _id: chatId },
    {
      $set: {
        users: [...chat._doc.users, userBeingAdded],
      },
    },
    {
      new: true,
    }
  );

  groupChat._doc._id = args.chatId;
  return groupChat._doc;
};
