import type { GroupChatResolvers } from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";
import type { InterfaceOrganization } from "../../models";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";

/**
 * Resolver function for the `organization` field of a `GroupChat`.
 *
 * This function retrieves the organization associated with a specific group chat.
 *
 * @param parent - The parent object representing the group chat. It contains information about the group chat, including the ID of the organization it is associated with.
 * @returns A promise that resolves to the organization document found in the database. This document represents the organization associated with the group chat.
 *
 * @see Organization - The Organization model used to interact with the organizations collection in the database.
 * @see GroupChatResolvers - The type definition for the resolvers of the GroupChat fields.
 *
 */
export const organization: GroupChatResolvers["organization"] = async (
  parent,
) => {
  const organizationFoundInCache = await findOrganizationsInCache([
    parent.organization,
  ]);

  if (!organizationFoundInCache.includes(null)) {
    return organizationFoundInCache[0] as InterfaceOrganization;
  }

  const organization = await Organization.findOne({
    _id: parent.organization,
  }).lean();
  if (organization) await cacheOrganizations([organization]);

  return organization as InterfaceOrganization;
};
