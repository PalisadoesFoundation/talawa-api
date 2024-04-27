import type { AgendaItemResolvers } from "../../types/generatedGraphQLTypes";
import { AgendaCategoryModel } from "../../models";
//@ts-expect-error - type error

export const categories: AgendaItemResolvers["categories"] = async (parent) => {
  const relatedCategoryIds = parent.categories;

  const relatedCategories = await AgendaCategoryModel.find({
    _id: { $in: relatedCategoryIds },
  }).lean();

  return relatedCategories;
};
