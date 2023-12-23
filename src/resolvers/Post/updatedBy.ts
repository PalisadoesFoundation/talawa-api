import type { PostResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const updatedBy: PostResolvers["updatedBy"] = async (parent) => {
  return await User.findOne({
    _id: parent.updatedBy,
  }).lean();
};
