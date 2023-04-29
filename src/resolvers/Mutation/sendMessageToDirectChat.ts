import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { DirectChat, DirectChatMessage, User } from "../../models";
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
export const sendMessageToDirectChat: MutationResolvers["sendMessageToDirectChat"] =
  async (_parent, args, context) => {
    const directChat = await DirectChat.findOne({
      _id: args.chatId,
    }).lean();

    if (!directChat) {
      throw new errors.NotFoundError(
        requestContext.translate(CHAT_NOT_FOUND_ERROR.MESSAGE),
        CHAT_NOT_FOUND_ERROR.CODE,
        CHAT_NOT_FOUND_ERROR.PARAM
      );
    }

    const currentUserExists = await User.exists({
      _id: context.userId,
    });

    if (currentUserExists === false) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }

    // directChat.users can only have 2 users. So, the following method works.
    const receiverIndex = directChat.users.findIndex(
      (user) => user.toString() !== context.userId.toString()
    );

    const createdDirectChatMessage = await DirectChatMessage.create({
      directChatMessageBelongsTo: directChat._id,
      sender: context.userId,
      receiver: directChat.users[receiverIndex],
      createdAt: new Date(),
      messageContent: args.messageContent,
    });

    // add createdDirectChatMessage to directChat
    await DirectChat.updateOne(
      {
        _id: directChat._id,
      },
      {
        $push: {
          messages: createdDirectChatMessage._id,
        },
      }
    );

    // calls subscription
    context.pubsub.publish("MESSAGE_SENT_TO_DIRECT_CHAT", {
      messageSentToDirectChat: createdDirectChatMessage.toObject(),
    });

    return createdDirectChatMessage.toObject();
  };
