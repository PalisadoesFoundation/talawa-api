import type { ActionItemCategoryResolvers } from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";

export const org: ActionItemCategoryResolvers["org"] = async (parent) => {
  return Organization.findOne({
    _id: parent.orgId,
  }).lean();
};
