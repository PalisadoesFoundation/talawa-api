import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { GroupChat, GroupChatMessage, User } from "../../models";
import {
  USER_NOT_AUTHORIZED_ERROR,
  CHAT_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
/**
 * This function enables to send message to group chat.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the group chat exists.
 * 2. If the user exists
 * 3. If the group chat contains the user.
 * @returns Group chat message.
 */
export const sendMessageToGroupChat: MutationResolvers["sendMessageToGroupChat"] =
  async (_parent, args, context) => {
    const groupChat = await GroupChat.findOne({
      _id: args.chatId,
    }).lean();

    if (!groupChat) {
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

    const currentUserIsAMemberOfGroupChat = groupChat.users.some((user) =>
      user.equals(context.userId),
    );

    /* 
    checks if users list of groupChat with _id === args.chatId contains
    current user with _id === context.userId
    */
    if (currentUserIsAMemberOfGroupChat === false) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    const createdGroupChatMessage = await GroupChatMessage.create({
      groupChatMessageBelongsTo: groupChat._id,
      sender: context.userId,
      createdAt: new Date(),
      messageContent: args.messageContent,
    });

    // add createdGroupChatMessage to groupChat
    await GroupChat.updateOne(
      {
        _id: args.chatId,
      },
      {
        $push: {
          messages: createdGroupChatMessage._id,
        },
      },
    );

    // calls subscription
    context.pubsub.publish("MESSAGE_SENT_TO_GROUP_CHAT", {
      messageSentToGroupChat: createdGroupChatMessage.toObject(),
    });

    return createdGroupChatMessage.toObject();
  };
