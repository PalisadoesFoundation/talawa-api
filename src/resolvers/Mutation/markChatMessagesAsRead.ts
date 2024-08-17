import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { Chat, User } from "../../models";
import { CHAT_NOT_FOUND_ERROR, USER_NOT_FOUND_ERROR } from "../../constants";
/**
 * This function enables to send message to direct chat.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the direct chat exists.
 * 2. If the user exists
 * @returns Direct chat message.
 */
export const markChatMessagesAsRead: MutationResolvers["markChatMessagesAsRead"] = async (
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

  const unseenMessagesByUsers = JSON.parse(chat.unseenMessagesByUsers as unknown as string);

  Object.keys(unseenMessagesByUsers).map((user: string) => {
    if(user === context.userId) {
      unseenMessagesByUsers[user] = 0;
    }
  });

  console.log('unseenMessagesByUsers', unseenMessagesByUsers)

  // add createdDirectChatMessage to directChat
  const updatedChat = await Chat.findByIdAndUpdate(
    {
      _id: chat._id,
    },
    {
      $set: {
        unseenMessagesByUsers: JSON.stringify(unseenMessagesByUsers),
      },
    },
  );

  console.log('updatedChat', updatedChat);

  return updatedChat;
};
