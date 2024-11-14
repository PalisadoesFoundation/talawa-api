import type { AgendaItemResolvers } from "../../types/generatedGraphQLTypes";
import { AgendaCategoryModel } from "../../models";

/**
 * Resolver function for the `categories` field of an `AgendaItem`.
 *
 * This function retrieves the categories associated with a specific agenda item.
 *
 * @param parent - The parent object representing the agenda item. It contains a list of category IDs associated with it.
 * @returns A promise that resolves to an array of category documents found in the database. These documents represent the categories associated with the agenda item.
 *
 * @see AgendaCategoryModel - The model used to interact with the categories collection in the database.
 * @see AgendaItemResolvers - The type definition for the resolvers of the AgendaItem fields.
 *
 */

export const categories: AgendaItemResolvers["categories"] = async (parent) => {
  const relatedCategoryIds = parent.categories;

  const relatedCategories = await AgendaCategoryModel.find({
    _id: { $in: relatedCategoryIds },
  }).lean();

  return relatedCategories;
};
