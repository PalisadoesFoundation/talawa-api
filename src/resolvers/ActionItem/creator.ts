import type { ActionItemResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const creator: ActionItemResolvers["creator"] = async (parent) => {
  return User.findOne({
    _id: parent.creatorId,
  }).lean();
};
