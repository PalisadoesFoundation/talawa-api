import type { ActionItemResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const updatedBy: ActionItemResolvers["updatedBy"] = async (parent) => {
  return User.findOne({
    _id: parent.updatedBy,
  }).lean();
};
