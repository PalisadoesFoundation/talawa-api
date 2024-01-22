import type { ActionItemCategoryResolvers } from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";

export const organization: ActionItemCategoryResolvers["organization"] = async (
  parent
) => {
  return Organization.findOne({
    _id: parent.organizationId,
  }).lean();
};
