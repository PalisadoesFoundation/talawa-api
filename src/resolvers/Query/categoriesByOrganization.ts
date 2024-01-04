import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Category } from "../../models";
/**
 * This query will fetch all categories for the organization from database.
 * @param _parent-
 * @param args - An object that contains `orderBy` to sort the object as specified and `id` of the Organization.
 * @returns A `categories` object that holds all categories with `ACTIVE` status for the Organization.
 */
export const categoriesByOrganization: QueryResolvers["categoriesByOrganization"] =
  async (_parent, args) => {
    const categories = await Category.find({
      org: args.orgId,
    })
      .populate("org")
      .lean();

    return categories;
  };
