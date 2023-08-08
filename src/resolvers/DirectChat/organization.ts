import { Organization } from "../../models";
import { findOrganizationsInCache } from "../../services/OrganizationCacheHelpers/findOrganizations";
import type { DirectChatResolvers } from "../../types/generatedGraphQLTypes";
/**
 * This resolver function will fetch and return the Organization for the Direct Chat from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An `object` that contains Organization data.
 */
export const organization: DirectChatResolvers["organization"] = async (
  parent
) => {

  const organizationFoundInCache = await findOrganizationsInCache([parent.organization])

  if (!organizationFoundInCache.includes(null)) {
    return JSON.parse(organizationFoundInCache[0]);
  }
  return await Organization.findOne({
    _id: parent.organization,
  }).lean();
};
