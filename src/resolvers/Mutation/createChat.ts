import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { Chat, User } from "../../models";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
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
    const organizationFoundInCache = await findOrganizationsInCache([
      args.data.organizationId,
    ]);

    organization = organizationFoundInCache[0];

    // Checks whether organization with _id === args.data.organizationId exists.
    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM,
      );
    }
  }

  const userExists = (await User.exists({
    _id: { $in: args.data.userIds },
  })) as unknown as string[];

  if (userExists && userExists.length !== args.data.userIds.length) {
    // Find which user ID(s) do not exist
    const missingUsers = args.data.userIds.filter(
      (id) => !userExists.includes(id),
    );
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      JSON.stringify({ missingUsers: missingUsers }),
    );
  }

  const now = new Date();

  const unseenMessagesByUsers = JSON.stringify(
    args.data.userIds.reduce((unseenMessages: Record<string, number>, user) => {
      unseenMessages[user] = 0;
      return unseenMessages;
    }, {}),
  );

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
        unseenMessagesByUsers,
      }
    : {
        creatorId: context.userId,
        users: args.data.userIds,
        isGroup: args.data.isGroup,
        createdAt: now,
        updatedAt: now,
        unseenMessagesByUsers,
      };

  const createdChat = await Chat.create(chatPayload);

  return createdChat;
};
