import type { InterfaceOrganization } from "../../models";
import { Organization } from "../../models";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import type { ChatResolvers, ResolverTypeWrapper } from "../../types/generatedGraphQLTypes";
import type { Types } from "mongoose";
/**
 * This resolver function will fetch and return the Organization for the Chat from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An `object` that contains Organization data.
 */
export const organization: ChatResolvers["organization"] = async (
  parent,
): Promise<ResolverTypeWrapper<InterfaceOrganization>> => {
  const organizationId = parent.organization?.toString();

  if (!organizationId) {
    throw new Error("Invalid organization ID");
  }

  const organizationFoundInCache = await findOrganizationsInCache([
    organizationId,
  ]);

  if (organizationFoundInCache[0]) {
    return organizationFoundInCache[0] as ResolverTypeWrapper<InterfaceOrganization>;
  }

  const organization = await Organization.findOne({
    _id: organizationId as unknown as Types.ObjectId,
  }).lean();

  if (!organization) {
    throw new Error("Organization not found");
  }

  await cacheOrganizations([organization as InterfaceOrganization]);

  return organization as ResolverTypeWrapper<InterfaceOrganization>;
};

