import type { GroupChatResolvers } from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
/**
 * This resolver function will fetch and return the organization for group chat from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An `object` that contains the organization data.
 */
export const organization: GroupChatResolvers["organization"] = async (
  parent
) => {

  const organizationFoundInCache = await findOrganizationsInCache([parent.organization])

  if (!organizationFoundInCache.includes(null)) {
    return organizationFoundInCache[0]!;
  }

  const organization= await Organization.findOne({
    _id: parent.organization,
  }).lean();


  cacheOrganizations([organization!]);

  return organization!;

};
