import type { ActionItemResolvers } from "../../types/generatedGraphQLTypes";
import { ActionItemCategory } from "../../models";

export const actionItemCategory: ActionItemResolvers["actionItemCategory"] = async (parent) => {
  return ActionItemCategory.findOne({
    _id: parent.actionItemCategoryId,
  }).lean();
};
