import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Organization, DirectChat } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  USER_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
} from "../../constants";

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
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const organizationExists = await Organization.exists({
    _id: args.data?.organizationId,
  });

  // Checks whether organization with _id === args.data.organizationId exists.
  if (organizationExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM
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
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
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
