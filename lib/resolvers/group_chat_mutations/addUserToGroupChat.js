const User = require('../../models/User');
const GroupChat = require('../../models/GroupChat');
const adminCheck = require('../functions/adminCheck');
const organizationExists = require('../../helper_functions/organizationExists');
const { NotFoundError, ConflictError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  NOT_FOUND_CHAT_MESSAGE,
  NOT_FOUND_CHAT_CODE,
  NOT_FOUND_CHAT_PARAM,
  CONFLICT_ALREADY_MEMBER_CODE,
  CONFLICT_ALREADY_MEMBER_MESSAGE,
  CONFLICT_ALREADY_MEMBER_PARAM,
} = require('../../../constants');

module.exports = async (parent, args, context) => {
  let chat = await GroupChat.findById(args.chatId);
  if (!chat) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_CHAT_MESSAGE),
      NOT_FOUND_CHAT_CODE,
      NOT_FOUND_CHAT_PARAM
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
      requestContext.translate(CONFLICT_ALREADY_MEMBER_MESSAGE),
      CONFLICT_ALREADY_MEMBER_CODE,
      CONFLICT_ALREADY_MEMBER_PARAM
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
