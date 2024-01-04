import type { ActionItemResolvers } from "../../types/generatedGraphQLTypes";
import { Category } from "../../models";

export const category: ActionItemResolvers["category"] = async (parent) => {
  return Category.findOne({
    _id: parent.category,
  }).lean();
};
