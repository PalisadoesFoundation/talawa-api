import type { CategoryResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const createdBy: CategoryResolvers["createdBy"] = async (parent) => {
  return User.findOne({
    _id: parent.createdBy,
  }).lean();
};
