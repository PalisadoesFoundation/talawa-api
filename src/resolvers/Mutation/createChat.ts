import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { Chat, Organization, User } from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
/**
 * This function enables to create a chat.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the organization exists
 * @returns Created chat
 */
export const createChat: MutationResolvers["createChat"] = async (
  _parent,
  args,
  context,
) => {
  let organization;
  if (args.data.isGroup && args.data.organizationId) {
    organization = await Organization.findOne({
      _id: args.data.organizationId,
    });

    // Checks whether organization with _id === args.data.organizationId exists.
    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM,
      );
    }
  }

  // const userExists = (await User.exists({
  //   _id: { $in: args.data.userIds },
  // })) as unknown as string[];

  const userExists = await User.find({
    _id: { $in: args.data.userIds },
  }).lean();

  if (userExists && userExists.length !== args.data.userIds.length) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  const now = new Date();

  const chatPayload = args.data.isGroup
    ? {
        isGroup: args.data.isGroup,
        creatorId: context.userId,
        users: args.data.userIds,
        organization: args.data.organizationId,
        name: args.data?.name,
        admins: [context.userId],
        createdAt: now,
        updatedAt: now,
        image: args.data.image,
      }
    : {
        creatorId: context.userId,
        users: args.data.userIds,
        isGroup: args.data.isGroup,
        createdAt: now,
        updatedAt: now,
      };

  const createdChat = await Chat.create(chatPayload);

  return createdChat;
};
