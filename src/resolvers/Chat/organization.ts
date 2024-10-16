import type { InterfaceOrganization } from "../../models";
import { Organization } from "../../models";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import type { ChatResolvers } from "../../types/generatedGraphQLTypes";
/**
 * This resolver function will fetch and return the Organization for the Chat from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An `object` that contains Organization data.
 */
export const organization: ChatResolvers["organization"] = async (parent) => {
  const organizationFoundInCache = await findOrganizationsInCache([
    parent.organization,
  ]);

  if (!organizationFoundInCache.includes(null)) {
    return organizationFoundInCache[0] as InterfaceOrganization;
  }

  const organization = await Organization.findOne({
    _id: parent.organization,
  }).lean();
  if (organization) cacheOrganizations([organization]);

  return organization as InterfaceOrganization;
};
