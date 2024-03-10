import type { AgendaCategoryResolvers } from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";
//@ts-ignore
export const organization: AgendaCategoryResolvers["organization"] = async (
  parent,
) => {
  return Organization.findOne(parent.organizationId).lean();
};
