import type { CategoryResolvers } from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";

export const org: CategoryResolvers["org"] = async (parent) => {
  return Organization.findOne({
    _id: parent.org,
  }).lean();
};
