import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, GroupChat, Organization } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  USER_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
} from "../../constants";
/**
 * This function enables to create a group chat.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the organization exists
 * @returns Created group chat
 */
export const createGroupChat: MutationResolvers["createGroupChat"] = async (
  _parent,
  args,
  context
) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  // Checks whether currentUser with _id === context.userId exists.
  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const organizationExists = await Organization.exists({
    _id: args.input?.organizationId,
  });

  // Checks whether organization with _id === args.input.organizationId exists.
  if (organizationExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM
    );
  }

  // Variable to store list of users to be members of groupChat.
  const usersInGroupChat = [];

  // Loops over each item in args.input.userIds list.
  for await (const userId of args.input!.userIds) {
    const userExists = await User.exists({
      _id: userId,
    });

    // Checks whether user with _id === userId exists.
    if (userExists === false) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }

    usersInGroupChat.push(userId);
  }

  // Creates new groupChat.
  const createdGroupChat = await GroupChat.create({
    creator: context.userId,
    users: usersInGroupChat,
    organization: args.input?.organizationId,
    title: args.input?.title,
  });

  // Returns createdGroupChat.
  return createdGroupChat.toObject();
};
