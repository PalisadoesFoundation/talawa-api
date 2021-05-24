const GroupChat = require('../../models/GroupChat');
const authCheck = require('../functions/authCheck');
const GroupChatMessage = require('../../models/GroupChatMessage');
const userExists = require('../../helper_functions/userExists');

module.exports = async (parent, args, context) => {
  authCheck(context);

  const chat = await GroupChat.findById(args.chatId);
  if (!chat) throw new Error('Chat not found');

  const sender = await userExists(context.userId);

  // ensure the user is a member of the group chat
  const userIsAMemberOfGroupChat = chat.users.filter(
    (user) => user === context.userId
  );
  if (!(userIsAMemberOfGroupChat.length > 0))
    throw new Error('User is not a member of this gorup chat');

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
