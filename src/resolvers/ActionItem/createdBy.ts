import type { ActionItemResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const createdBy: ActionItemResolvers["createdBy"] = async (parent) => {
  return User.findOne({
    _id: parent.createdBy,
  }).lean();
};
