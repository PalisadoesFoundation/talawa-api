import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceActionItem } from "../../models";
import { ActionItem, ActionItemCategory } from "../../models";
import { getWhere } from "./helperFunctions/getWhere";
import { getSort } from "./helperFunctions/getSort";
/**
 * This query will fetch all action items for an organization from database.
 * @param _parent-
 * @param args - An object that contains `organizationId` which is the _id of the Organization.
 * @returns An `actionItems` object that holds all action items for the Event.
 */
export const actionItemsByOrganization: QueryResolvers["actionItemsByOrganization"] =
  async (_parent, args) => {
    const where = getWhere<InterfaceActionItem>(args.where);
    const sort = getSort(args.orderBy);

    // Get the ids of all ActionItemCategories associated with the organization
    const actionItemCategories = await ActionItemCategory.find({
      organizationId: args.organizationId,
    });
    const actionItemCategoriesIds = actionItemCategories.map(
      (category) => category._id
    );

    const actionItems = await ActionItem.find({
      actionItemCategoryId: { $in: actionItemCategoriesIds },
      ...where,
    })
      .sort(sort)
      .lean();

    return actionItems;
  };
