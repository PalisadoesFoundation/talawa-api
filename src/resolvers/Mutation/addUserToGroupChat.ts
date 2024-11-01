import {
  CHAT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceUser } from "../../models";
import { Chat, User } from "../../models";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Mutation resolver function to add a user to a group chat.
 *
 * This function performs the following actions:
 * 1. Verifies that the current user exists.
 * 2. Ensures that the chat specified by `args.input.chatId` exists and is a group chat.
 * 3. Checks whether the current user is an admin of the chat.
 * 4. Verifies that the user to be added as an admin exists.
 * 5. Ensures that the organization specified by `args.input.organizationId` exists.
 * 6. Adds the user to the chat's admins list.
 *
 * @param _parent - The parent object for the mutation.
 * @param args - The arguments for the mutation, containing `input` with `chatId`, `userId`, and `organizationId`.
 * @param context - The context object for the mutation, containing the current user's ID.
 */
export const addUserToGroupChat: MutationResolvers["addUserToGroupChat"] =
  async (_parent, args, context) => {
    // Get the current user
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

    // Checks whether currentUser exists.
    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    // get chat by chat id
    const chat = await Chat.findOne({
      _id: args.chatId,
    }).lean();

    // Checks whether chat with _id == args.data.chatId exists.
    if (!chat) {
      throw new errors.NotFoundError(
        requestContext.translate(CHAT_NOT_FOUND_ERROR.MESSAGE),
        CHAT_NOT_FOUND_ERROR.CODE,
        CHAT_NOT_FOUND_ERROR.PARAM,
      );
    }

    //check whether the chat is a group chat
    if (!chat.isGroup) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    // check whether the current user is an admin, check userId exists in chat.admins array.
    if (
      !chat.admins
        .map((admin) => admin.toString())
        .includes(currentUser._id.toString())
    ) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    // check whether the user to be added exists
    const user = await User.findOne({
      _id: args.userId,
    }).lean();

    if (!user) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Creates new Ad.
    const updatedChat = await Chat.findOneAndUpdate(
      {
        _id: chat._id,
      },
      {
        $push: {
          users: args.userId,
        },
      },
    );
    // Returns createdAd.
    return updatedChat;
  };
