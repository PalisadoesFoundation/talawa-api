const GroupChat = require('../../models/GroupChat');
const adminCheck = require('../functions/adminCheck');
const organizationExists = require('../../helper_functions/organizationExists');
const { NotFoundError, UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');

const {
  NOT_FOUND_CHAT_MESSAGE,
  NOT_FOUND_CHAT_CODE,
  NOT_FOUND_CHAT_PARAM,
  NOT_AUTHORIZED_USER_CODE,
  NOT_AUTHORIZED_USER_MESSAGE,
  NOT_AUTHORIZED_USER_PARAM,
} = require('../../../constants');
module.exports = async (parent, args, context) => {
  const chat = await GroupChat.findById(args.chatId);
  if (!chat) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_CHAT_MESSAGE),
      NOT_FOUND_CHAT_CODE,
      NOT_FOUND_CHAT_PARAM
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
      requestContext.translate(NOT_AUTHORIZED_USER_MESSAGE),
      NOT_AUTHORIZED_USER_CODE,
      NOT_AUTHORIZED_USER_PARAM
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
