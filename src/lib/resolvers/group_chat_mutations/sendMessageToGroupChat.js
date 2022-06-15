const GroupChat = require('../../models/GroupChat');
const GroupChatMessage = require('../../models/GroupChatMessage');
const userExists = require('../../helper_functions/userExists');
const { NotFoundError, UnauthorizedError } = require('../../helper_lib/errors');
const requestContext = require('../../helper_lib/request-context');
const {
  IN_PRODUCTION,
  USER_NOT_AUTHORIZED,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_PARAM,
  CHAT_NOT_FOUND,
  CHAT_NOT_FOUND_PARAM,
  CHAT_NOT_FOUND_MESSAGE,
  CHAT_NOT_FOUND_CODE,
} = require('../../../constants');

module.exports = async (parent, args, context) => {
  const chat = await GroupChat.findById(args.chatId);
  if (!chat) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? CHAT_NOT_FOUND
        : requestContext.translate(CHAT_NOT_FOUND_MESSAGE),
      CHAT_NOT_FOUND_CODE,
      CHAT_NOT_FOUND_PARAM
    );
  }

  const sender = await userExists(context.userId);

  // ensure the user is a member of the group chat
  const userIsAMemberOfGroupChat = chat.users.filter(
    (user) => user.toString() === context.userId
  );
  if (!(userIsAMemberOfGroupChat.length > 0)) {
    throw new UnauthorizedError(
      !IN_PRODUCTION
        ? USER_NOT_AUTHORIZED
        : requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
      USER_NOT_AUTHORIZED_CODE,
      USER_NOT_AUTHORIZED_PARAM
    );
  }

  const message = new GroupChatMessage({
    groupChatMessageBelongsTo: chat._doc,
    sender: sender._id,
    createdAt: new Date(),
    messageContent: args.messageContent,
  });

  await message.save();

  // add message to chat
  await GroupChat.updateOne(
    {
      _id: args.chatId,
    },
    {
      $set: {
        messages: [...chat._doc.messages, message],
      },
    }
  );

  //calls subscription
  context.pubsub.publish('MESSAGE_SENT_TO_GROUP_CHAT', {
    messageSentToGroupChat: {
      ...message._doc,
    },
  });

  return message._doc;
};
