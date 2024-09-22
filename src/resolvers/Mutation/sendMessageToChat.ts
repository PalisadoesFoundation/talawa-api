import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { Chat, User, ChatMessage } from "../../models";
import { CHAT_NOT_FOUND_ERROR, USER_NOT_FOUND_ERROR } from "../../constants";
/**
 * This function enables to send message to chat.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the direct chat exists.
 * 2. If the user exists
 * @returns  Chat message.
 */
export const sendMessageToChat: MutationResolvers["sendMessageToChat"] = async (
  _parent,
  args,
  context,
) => {
  const chat = await Chat.findOne({
    _id: args.chatId,
  }).lean();

  if (!chat) {
    throw new errors.NotFoundError(
      requestContext.translate(CHAT_NOT_FOUND_ERROR.MESSAGE),
      CHAT_NOT_FOUND_ERROR.CODE,
      CHAT_NOT_FOUND_ERROR.PARAM,
    );
  }

  const currentUserExists = !!(await User.exists({
    _id: context.userId,
  }));

  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  const now = new Date();

  const createdChatMessage = await ChatMessage.create({
    chatMessageBelongsTo: chat._id,
    sender: context.userId,
    messageContent: args.messageContent,
    replyTo: args.replyTo,
    createdAt: now,
    updatedAt: now,
  });

  // add createdDirectChatMessage to directChat
  await Chat.updateOne(
    {
      _id: chat._id,
    },
    {
      $push: {
        messages: createdChatMessage._id,
      },
    },
  );

  // calls subscription
  context.pubsub.publish("MESSAGE_SENT_TO_CHAT", {
    messageSentToChat: createdChatMessage.toObject(),
  });

  return createdChatMessage.toObject();
};
