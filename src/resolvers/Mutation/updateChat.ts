import {
  CHAT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceChat, InterfaceUser } from "../../models";
import { Chat, User } from "../../models";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { uploadEncodedImage } from "../../utilities/encodedImageStorage/uploadEncodedImage";

/**
 * This function enables to update a chat.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the chat exists
 * 2. If the user is a member of the chat
 * @returns Updated chat
 */
export const updateChat: MutationResolvers["updateChat"] = async (
  _parent,
  args,
  context,
) => {
  const { _id } = args.input;
  // Check if the chat exists
  const existingchat = await Chat.findById(_id);
  if (!existingchat) {
    throw new errors.NotFoundError(
      requestContext.translate(CHAT_NOT_FOUND_ERROR.MESSAGE),
      CHAT_NOT_FOUND_ERROR.CODE,
      CHAT_NOT_FOUND_ERROR.PARAM,
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

  // Check if the user is a member of the chat
  if (
    !existingchat.users
      .map((user) => user.toString())
      .includes(currentUser._id.toString())
  ) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  let uploadMediaFile = null;

  // Handle media file upload
  if (existingchat.isGroup === true && args.input.image) {
    uploadMediaFile = await uploadEncodedImage(args.input.image, null);
  }

  // Prepare fields to update
  const fieldsToUpdate = args.input.image
    ? { ...args.input, image: uploadMediaFile }
    : { ...args.input, image: existingchat.image };

  // Update the advertisement in the database
  const updatedChat = await Chat.findOneAndUpdate(
    {
      _id: _id,
    },
    {
      $set: fieldsToUpdate,
    },
    {
      new: true,
    },
  ).lean();

  return updatedChat as InterfaceChat;
};

export default updateChat;
