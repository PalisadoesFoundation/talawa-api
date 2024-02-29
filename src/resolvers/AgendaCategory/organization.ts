import type {
  AgendaCategoryResolvers,
  ResolverTypeWrapper,
} from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";
import type { InterfaceOrganization } from "../../models";

export const organization: AgendaCategoryResolvers["organization"] = async (
  parent,
): Promise<ResolverTypeWrapper<InterfaceOrganization>> => {
  const organization = await Organization.findOne(parent.organization).lean();
  if (!organization) {
    // If the organization is not found, throw an error instead of returning null
    throw new Error("Organization not found");
  }
  return organization; // This will now always return an organization object, never null
};
