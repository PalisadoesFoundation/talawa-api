import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { ActionItemCategory } from "../../models";
import { getWhere } from "./helperFunctions/getWhere";
import { getSort } from "./helperFunctions/getSort";
/**
 * This query will fetch all categories for the organization from database.
 * @param _parent-
 * @param args - An object that contains `organizationId` which is the _id of the Organization and `orderBy` which is the sorting order & where which is the filter.
 * @returns A `categories` object that holds all categories for the Organization.
 */
export const actionItemCategoriesByOrganization: QueryResolvers["actionItemCategoriesByOrganization"] =
  async (_parent, args) => {
    const sort = getSort(args.orderBy);
    const where = getWhere(args.where);
    const categories = await ActionItemCategory.find({
      organizationId: args.organizationId,
      ...where,
    })
      .sort(sort)
      .lean();

    return categories;
  };
