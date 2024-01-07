import type { TaskResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const creator: TaskResolvers["creator"] = async (parent) => {
  return User.findOne({
    _id: parent.creatorId,
  }).lean();
};
