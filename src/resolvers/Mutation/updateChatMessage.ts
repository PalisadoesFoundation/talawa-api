import { USER_NOT_FOUND_ERROR, MESSAGE_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceChatMessage, InterfaceUser } from "../../models";
import { ChatMessage, User } from "../../models";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
// import { uploadEncodedImage } from "../../utilities/encodedImageStorage/uploadEncodedImage";

export const updateChatMessage: MutationResolvers["updateChatMessage"] = async (
  _parent,
  args,
  context,
) => {
  const { messageId } = args.input;
  // Check if the chat exists
  const existingChatMessage = await ChatMessage.findById(messageId);
  if (!existingChatMessage) {
    throw new errors.NotFoundError(
      requestContext.translate(MESSAGE_NOT_FOUND_ERROR.MESSAGE),
      MESSAGE_NOT_FOUND_ERROR.CODE,
      MESSAGE_NOT_FOUND_ERROR.PARAM,
    );
  }

  // Check if the user is a member of the chat
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

  // Update the advertisement in the database
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
