import type { ActionItemCategoryResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const creator: ActionItemCategoryResolvers["creator"] = async (
  parent
) => {
  return User.findOne({
    _id: parent.creatorId,
  }).lean();
};
