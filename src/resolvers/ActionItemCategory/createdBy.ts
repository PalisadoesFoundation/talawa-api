import type { ActionItemCategoryResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const createdBy: ActionItemCategoryResolvers["createdBy"] = async (parent) => {
  return User.findOne({
    _id: parent.createdBy,
  }).lean();
};
