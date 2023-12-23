import type { TaskResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const updatedBy: TaskResolvers["updatedBy"] = async (parent) => {
  return User.findOne({
    _id: parent.updatedBy,
  }).lean();
};
