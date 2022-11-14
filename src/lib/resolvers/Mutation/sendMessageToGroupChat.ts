import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { errors, requestContext } from "../../libraries";
import { GroupChat, GroupChatMessage, User } from "../../models";
import {
  IN_PRODUCTION,
  USER_NOT_AUTHORIZED,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_PARAM,
  CHAT_NOT_FOUND,
  CHAT_NOT_FOUND_PARAM,
  CHAT_NOT_FOUND_MESSAGE,
  CHAT_NOT_FOUND_CODE,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
} from "../../../constants";
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
        IN_PRODUCTION !== true
          ? CHAT_NOT_FOUND
          : requestContext.translate(CHAT_NOT_FOUND_MESSAGE),
        CHAT_NOT_FOUND_CODE,
        CHAT_NOT_FOUND_PARAM
      );
    }

    const currentUserExists = await User.exists({
      _id: context.userId,
    });

    if (currentUserExists === false) {
      throw new errors.NotFoundError(
        IN_PRODUCTION !== true
          ? USER_NOT_FOUND
          : requestContext.translate(USER_NOT_FOUND_MESSAGE),
        USER_NOT_FOUND_CODE,
        USER_NOT_FOUND_PARAM
      );
    }

    const currentUserIsAMemberOfGroupChat = groupChat.users.some(
      (user) => user.toString() === context.userId.toString()
    );

    /* 
    checks if users list of groupChat with _id === args.chatId contains
    current user with _id === context.userId
    */
    if (currentUserIsAMemberOfGroupChat === false) {
      throw new errors.UnauthorizedError(
        IN_PRODUCTION !== true
          ? USER_NOT_AUTHORIZED
          : requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
        USER_NOT_AUTHORIZED_CODE,
        USER_NOT_AUTHORIZED_PARAM
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
      }
    );

    // calls subscription
    context.pubsub.publish("MESSAGE_SENT_TO_GROUP_CHAT", {
      messageSentToGroupChat: createdGroupChatMessage.toObject(),
    });

    return createdGroupChatMessage.toObject();
  };
