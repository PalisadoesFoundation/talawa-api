import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { Chat, Organization, User } from "../../models";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
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
export const createChat: MutationResolvers["createChat"] = async (
  _parent,
  args,
  context,
) => {
  let organization;
  const usersInChat = [];
  if (args.data.isGroup && args.data.organizationId) {
    const organizationFoundInCache = await findOrganizationsInCache([
      args.data.organizationId,
    ]);

    organization = organizationFoundInCache[0];

    if (organizationFoundInCache.includes(null)) {
      organization = await Organization.findOne({
        _id: args.data.organizationId,
      }).lean();
      if (organization) await cacheOrganizations([organization]);
    }

    // Checks whether organization with _id === args.data.organizationId exists.
    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM,
      );
    }
  }

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
    usersInChat.push(userId);
  }

  const now = new Date();

  const unseenMessagesByUsers = JSON.stringify(usersInChat.reduce((unseenMessages: Record<string, number>, user) => {
     unseenMessages[user] = 0;
     return unseenMessages;
  }, {}));

  const chatPayload = args.data.isGroup
    ? {
        isGroup: args.data.isGroup,
        creatorId: context.userId,
        users: usersInChat,
        organization: args.data?.organizationId,
        name: args.data?.name,
        admins: [context.userId],
        createdAt: now,
        updatedAt: now,
        image: args.data.image,
        unseenMessagesByUsers
      }
    : {
        creatorId: context.userId,
        users: usersInChat,
        isGroup: args.data.isGroup,
        createdAt: now,
        updatedAt: now,
        unseenMessagesByUsers
      };

  const createdChat = await Chat.create(chatPayload);

  return createdChat.toObject();
};
