import type { TaskResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const createdBy: TaskResolvers["createdBy"] = async (parent) => {
  return User.findOne({
    _id: parent.createdBy,
  }).lean();
};
