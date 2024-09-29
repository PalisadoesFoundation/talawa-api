import {
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceAppUserProfile, InterfaceUser } from "../../models";
import { AppUserProfile, MessageChat, User } from "../../models";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Creates a new chat message between users.
 *
 * This function performs the following actions:
 * 1. Verifies the existence of the current user.
 * 2. Retrieves and caches the current user's details and application profile if not already cached.
 * 3. Checks the existence of the receiver user and retrieves their application profile.
 * 4. Ensures that both the current user and the receiver have valid application profiles.
 * 5. Compares the language codes of the sender and receiver to determine if there is a language barrier.
 * 6. Creates a new chat message with the specified content and language barrier status.
 * 7. Publishes the created message chat to a pub/sub channel for real-time updates.
 *
 * @param _parent - The parent object for the mutation. This parameter is not used in this resolver.
 * @param args - The arguments for the mutation, including:
 *   - `data.receiver`: The ID of the user receiving the message.
 *   - `data.message`: The content of the message being sent.
 * @param context - The context for the mutation, including:
 *   - `userId`: The ID of the current user sending the message.
 *   - `pubsub`: The pub/sub instance for publishing real-time updates.
 *
 * @returns The created message chat record.
 *
 */
export const createMessageChat: MutationResolvers["createMessageChat"] = async (
  _parent,
  args,
  context,
) => {
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
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  let currentUserAppProfile: InterfaceAppUserProfile | null;
  const appUserProfileFoundInCache = await findAppUserProfileCache([
    currentUser.appUserProfileId?.toString(),
  ]);
  currentUserAppProfile = appUserProfileFoundInCache[0];
  if (currentUserAppProfile === null) {
    currentUserAppProfile = await AppUserProfile.findOne({
      userId: currentUser._id,
    }).lean();
    if (currentUserAppProfile !== null) {
      await cacheAppUserProfile([currentUserAppProfile]);
    }
  }

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
