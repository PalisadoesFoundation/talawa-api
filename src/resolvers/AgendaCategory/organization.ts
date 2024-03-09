import type { AgendaCategoryResolvers } from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";

export const organization: AgendaCategoryResolvers["organization"] = async (
  parent,
) => {
  return Organization.findOne(parent.organizationId).lean();
};
