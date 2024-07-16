import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, DirectChat } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  USER_NOT_FOUND_ERROR,
} from "../../constants";
/**
 * This function enables to create direct chat.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the organization exists
 * 2. If the user exists
 * @returns Created chat
 */
export const createDirectChat: MutationResolvers["createDirectChat"] = async (
  _parent,
  args,
  context,
) => {
  // Variable to store list of users to be members of directChat.
  const usersInDirectChat = [];

  // Loops over each item in args.data.userIds list.
  for await (const userId of args.data.userIds) {
    const userExists = !!(await User.exists({
      _id: userId,
    }));

    // Checks whether user with _id === userId exists.
    if (userExists === false) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    usersInDirectChat.push(userId);
  }

  // Creates new directChat.
  const createdDirectChat = await DirectChat.create({
    creatorId: context.userId,
    users: usersInDirectChat,
  });

  // Returns createdDirectChat.
  return createdDirectChat.toObject();
};
