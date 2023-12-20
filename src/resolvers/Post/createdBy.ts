import type { PostResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const createdBy: PostResolvers["createdBy"] = async (parent) => {
  return await User.findOne({
    _id: parent.createdBy,
  }).lean();
};
