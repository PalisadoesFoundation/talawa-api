import type { FundResolvers } from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";

export const organization: FundResolvers["organization"] = async (parent) => {
  return await Organization.findOne({
    id: parent?.organization,
  }).lean();
};
