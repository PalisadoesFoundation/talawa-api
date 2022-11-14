import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { User, Organization, DirectChat } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_PARAM,
} from "../../../constants";
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
  context
) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  // Checks whether currentUser with _id === context.userId exists.
  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  const organizationExists = await Organization.exists({
    _id: args.data?.organizationId,
  });

  // Checks whether organization with _id === args.data.organizationId exists.
  if (organizationExists === false) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? ORGANIZATION_NOT_FOUND
        : requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
      ORGANIZATION_NOT_FOUND_CODE,
      ORGANIZATION_NOT_FOUND_PARAM
    );
  }

  // Variable to store list of users to be members of directChat.
  const usersInDirectChat = [];

  // Loops over each item in args.data.userIds list.
  for await (const userId of args.data!.userIds) {
    const userExists = await User.exists({
      _id: userId,
    });

    // Checks whether user with _id === userId exists.
    if (userExists === false) {
      throw new errors.NotFoundError(
        IN_PRODUCTION !== true
          ? USER_NOT_FOUND
          : requestContext.translate(USER_NOT_FOUND_MESSAGE),
        USER_NOT_FOUND_CODE,
        USER_NOT_FOUND_PARAM
      );
    }

    usersInDirectChat.push(userId);
  }

  // Creates new directChat.
  const createdDirectChat = await DirectChat.create({
    creator: context.userId,
    users: usersInDirectChat,
    organization: args.data?.organizationId,
  });

  // Returns createdDirectChat.
  return createdDirectChat.toObject();
};
