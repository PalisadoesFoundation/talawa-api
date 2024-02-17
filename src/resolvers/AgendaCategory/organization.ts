import { Organization } from "../../models";
import type { AgendaCategoryResolvers } from "../../types/generatedGraphQLTypes";

export const organization: AgendaCategoryResolvers["organization"] = async (
  parent,
) => {
  return Organization.findOne(parent.organizationId).lean();
};
