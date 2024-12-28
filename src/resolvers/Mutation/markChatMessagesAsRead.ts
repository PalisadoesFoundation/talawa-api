import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { Chat, User } from "../../models";
import { CHAT_NOT_FOUND_ERROR, USER_NOT_FOUND_ERROR } from "../../constants";
/**
 /**
 * This function marks all messages as read for the current user in a chat.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the direct chat exists.
 * 2. If the user exists
 * @returns Updated chat object.
 */
export const markChatMessagesAsRead: MutationResolvers["markChatMessagesAsRead"] =
  async (_parent, args, context) => {
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

    const currentUserExists = await User.exists({
      _id: context.userId,
    }).lean();

    if (!currentUserExists) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    const unseenMessagesByUsers = JSON.parse(
      chat.unseenMessagesByUsers as unknown as string,
    );

    if (unseenMessagesByUsers[context.userId] !== undefined) {
      unseenMessagesByUsers[context.userId] = 0;
    }

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

    return updatedChat;
  };
