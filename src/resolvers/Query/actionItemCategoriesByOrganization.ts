import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { ActionItemCategory } from "../../models";
/**
 * This query will fetch all categories for the organization from database.
 * @param _parent-
 * @param args - An object that contains `orgId` which is the _id of the Organization.
 * @returns A `categories` object that holds all categories for the Organization.
 */
export const actionItemCategoriesByOrganization: QueryResolvers["actionItemCategoriesByOrganization"] =
  async (_parent, args) => {
    const categories = await ActionItemCategory.find({
      orgId: args.orgId,
    }).lean();

    return categories;
  };
