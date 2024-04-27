import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { DirectChat, DirectChatMessage, Organization } from "../../models";
import { adminCheck } from "../../utilities";
import { errors, requestContext } from "../../libraries";
import {
  CHAT_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
} from "../../constants";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
/**
 * This function enables to remove direct chat.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the organization exists
 * 2. If the chat exists
 * 3. If the user is an admin of the organization.
 * @returns Deleted chat.
 */
export const removeDirectChat: MutationResolvers["removeDirectChat"] = async (
  _parent,
  args,
  context,
) => {
  let organization;

  const organizationFoundInCache = await findOrganizationsInCache([
    args.organizationId,
  ]);

  organization = organizationFoundInCache[0];

  if (organizationFoundInCache.includes(null)) {
    organization = await Organization.findOne({
      _id: args.organizationId,
    }).lean();
    if (organization) await cacheOrganizations([organization]);
  }

  // Checks whether organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM,
    );
  }

  const directChat = await DirectChat.findOne({
    _id: args.chatId,
  }).lean();

  // Checks whether directChat exists.
  if (!directChat) {
    throw new errors.NotFoundError(
      requestContext.translate(CHAT_NOT_FOUND_ERROR.MESSAGE),
      CHAT_NOT_FOUND_ERROR.CODE,
      CHAT_NOT_FOUND_ERROR.PARAM,
    );
  }

  // Checks whether currentUser with _id === context.userId is an admin of organzation.
  await adminCheck(context.userId, organization);

  // Deletes all directChatMessages with _id as one of the ids in directChat.messages list.
  await DirectChatMessage.deleteMany({
    _id: {
      $in: directChat.messages,
    },
  });

  // Deletes the directChat.
  await DirectChat.deleteOne({
    _id: args.chatId,
  });

  // Returns deleted directChat.
  return directChat;
};
