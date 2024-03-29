import {
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { AppUserProfile, MessageChat, User } from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
/**
 * This function enables to create a chat.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the receiver user exists
 * 2. If the sender and receiver users have same language code.
 * 3. If the sender and receiver users have appProfile.
 * @returns Created message chat.
 */
export const createMessageChat: MutationResolvers["createMessageChat"] = async (
  _parent,
  args,
  context,
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  }).lean();
  if (!currentUser) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  const currentUserAppProfile = await AppUserProfile.findOne({
    userId: currentUser._id,
  }).lean();

  const receiverUser = await User.findOne({
    _id: args.data.receiver,
  }).lean();

  // Checks whether receiverUser exists.
  if (!receiverUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }
  const receiverUserAppProfile = await AppUserProfile.findOne({
    userId: receiverUser._id,
  }).lean();
  if (!receiverUserAppProfile) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  if (!currentUserAppProfile) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }
  // Boolean to identify whether both sender and receiver for messageChat have the same appLanguageCode.
  const isSenderReceiverLanguageSame =
    receiverUserAppProfile?.appLanguageCode ===
    currentUserAppProfile?.appLanguageCode;

  // Creates new messageChat.
  const createdMessageChat = await MessageChat.create({
    sender: currentUser?._id,
    receiver: receiverUser._id,
    message: args.data.message,
    languageBarrier: !isSenderReceiverLanguageSame,
  });

  context.pubsub.publish("CHAT_CHANNEL", {
    directMessageChat: {
      ...createdMessageChat,
    },
  });

  // Returns createdMessageChat.
  return createdMessageChat.toObject();
};
