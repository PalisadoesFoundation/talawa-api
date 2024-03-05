import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { ActionItem, ActionItemCategory } from "../../models";
/**
 * This query will fetch all action items for an organization from database.
 * @param _parent-
 * @param args - An object that contains `organizationId` which is the _id of the Organization.
 * @returns An `actionItems` object that holds all action items for the Event.
 */
export const actionItemsByOrganization: QueryResolvers["actionItemsByOrganization"] =
  async (_parent, args) => {
    // Get the ids of all ActionItemCategories associated with the organization
    const actionItemCategories = await ActionItemCategory.find({
      organizationId: args.organizationId,
    });
    const actionItemCategoriesIds = actionItemCategories.map(
      (category) => category._id,
    );

    const actionItems = await ActionItem.find({
      actionItemCategoryId: { $in: actionItemCategoriesIds },
    }).lean();

    return actionItems;
  };
