const GroupChat = require('../../models/GroupChat');
const GroupChatMessage = require('../../models/GroupChatMessage');
const userExists = require('../../helper_functions/userExists');
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

  const sender = await userExists(context.userId);

  // ensure the user is a member of the group chat
  const userIsAMemberOfGroupChat = chat.users.filter(
    (user) => user.toString() === context.userId
  );
  //console.log(userIsAMemberOfGroupChat)
  if (!(userIsAMemberOfGroupChat.length > 0)) {
    throw new UnauthorizedError(
      requestContext.translate(NOT_AUTHORIZED_USER_MESSAGE),
      NOT_AUTHORIZED_USER_CODE,
      NOT_AUTHORIZED_USER_PARAM
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
