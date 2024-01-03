import type { CategoryResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const updatedBy: CategoryResolvers["updatedBy"] = async (parent) => {
  return User.findOne({
    _id: parent.updatedBy,
  }).lean();
};
