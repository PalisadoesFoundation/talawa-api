import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { DirectChat, DirectChatMessage, User } from "../../models";
import {
  IN_PRODUCTION,
  CHAT_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";

export const sendMessageToDirectChat: MutationResolvers["sendMessageToDirectChat"] =
  async (_parent, args, context) => {
    const directChat = await DirectChat.findOne({
      _id: args.chatId,
    }).lean();

    if (!directChat) {
      throw new errors.NotFoundError(
        IN_PRODUCTION !== true
          ? CHAT_NOT_FOUND_ERROR.DESC
          : requestContext.translate(CHAT_NOT_FOUND_ERROR.MESSAGE),
        CHAT_NOT_FOUND_ERROR.CODE,
        CHAT_NOT_FOUND_ERROR.PARAM
      );
    }

    const currentUserExists = await User.exists({
      _id: context.userId,
    });

    if (currentUserExists === false) {
      throw new errors.NotFoundError(
        IN_PRODUCTION !== true
          ? USER_NOT_FOUND_ERROR.DESC
          : requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
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
