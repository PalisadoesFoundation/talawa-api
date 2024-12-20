import {
  USER_NOT_FOUND_ERROR,
  MESSAGE_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  CHAT_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceChatMessage, InterfaceUser } from "../../models";
import { Chat, ChatMessage, User } from "../../models";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

// generate the snippet from the following code
/**
 * This function enables to update a chat message.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the chat message exists.
 * 2. If the chat exists.
 * 3. If the user exists.
 * 4. If the user is a member of the chat.
 * 5. If the user is the sender of the message.
 * @returns Updated chat message.
 */
export const updateChatMessage: MutationResolvers["updateChatMessage"] = async (
  _parent,
  args,
  context,
) => {
  const { messageId } = args.input;
  // Check if the chat message exists
  const existingChatMessage = await ChatMessage.findById(messageId);
  if (!existingChatMessage) {
    throw new errors.NotFoundError(
      requestContext.translate(MESSAGE_NOT_FOUND_ERROR.MESSAGE),
      MESSAGE_NOT_FOUND_ERROR.CODE,
      MESSAGE_NOT_FOUND_ERROR.PARAM,
    );
  }

  // check if the chat exists
  const chat = await Chat.findOne({
    _id: args.input.chatId,
  });

  if (!chat) {
    throw new errors.NotFoundError(
      requestContext.translate(CHAT_NOT_FOUND_ERROR.MESSAGE),
      CHAT_NOT_FOUND_ERROR.CODE,
      CHAT_NOT_FOUND_ERROR.PARAM,
    );
  }

  // Check if the user exists
  let currentUser: InterfaceUser | null;
  const userFoundInCache = await findUserInCache([context.userId]);
  currentUser = userFoundInCache[0];
  if (currentUser === null) {
    currentUser = await User.findOne({
      _id: context.userId,
    }).lean();
    if (currentUser !== null) {
      await cacheUsers([currentUser]);
    }
  }

  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  //Check if user is a member of the chat
  if (
    !chat.users
      .map((user: string) => user.toString())
      .includes(currentUser._id.toString())
  ) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  // Check if the user is the sender of the message
  if (existingChatMessage.sender.toString() !== currentUser._id.toString()) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  // Update the chat message
  const updatedChatMessage = await ChatMessage.findOneAndUpdate(
    {
      _id: messageId,
    },
    {
      $set: { messageContent: args.input.messageContent },
    },
    {
      new: true,
    },
  ).lean();

  return updatedChatMessage as InterfaceChatMessage;
};

export default updateChatMessage;
