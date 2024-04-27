import { adminCheck } from "../../utilities";
import {
  CHAT_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
} from "../../constants";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { GroupChat, GroupChatMessage, Organization } from "../../models";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
/**
 * This function enables to remove an graoup chat.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the group chat exists
 * 2. If the organization exists
 * 3. If the user is an admin of the organization.
 * @returns Deleted group chat.
 */
export const removeGroupChat: MutationResolvers["removeGroupChat"] = async (
  _parent,
  args,
  context,
) => {
  const groupChat = await GroupChat.findOne({
    _id: args.chatId,
  }).lean();

  // Checks if a groupChat with _id === args.chatId exists.
  if (!groupChat) {
    throw new errors.NotFoundError(
      requestContext.translate(CHAT_NOT_FOUND_ERROR.MESSAGE),
      CHAT_NOT_FOUND_ERROR.CODE,
      CHAT_NOT_FOUND_ERROR.PARAM,
    );
  }

  let organization;

  const organizationFoundInCache = await findOrganizationsInCache([
    groupChat.organization,
  ]);

  organization = organizationFoundInCache[0];

  if (organizationFoundInCache.includes(null)) {
    organization = await Organization.findOne({
      _id: groupChat.organization,
    }).lean();
    if (organization) await cacheOrganizations([organization]);
  }

  // Checks if an organization with _id === groupChat.organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM,
    );
  }

  // Checks whether current user making the request is an admin of organization.
  await adminCheck(context.userId, organization);

  // Delete all groupChatMessages that have their ids stored in messages list of groupChat
  await GroupChatMessage.deleteMany({
    _id: {
      $in: groupChat.messages,
    },
  });

  // Delete the groupChat
  await GroupChat.deleteOne({
    _id: groupChat._id,
  });

  return groupChat;
};
