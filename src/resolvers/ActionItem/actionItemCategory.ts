import type { ActionItemResolvers } from "../../types/generatedGraphQLTypes";
import { ActionItemCategory } from "../../models";

/**
 * Resolver function to fetch the category of an action item.
 * @param parent - The parent object containing the action item data.
 * @returns The category of the action item found in the database.
 */
export const actionItemCategory: ActionItemResolvers["actionItemCategory"] =
  async (parent) => {
    return ActionItemCategory.findOne({
      _id: parent.actionItemCategoryId,
    }).lean();
  };
