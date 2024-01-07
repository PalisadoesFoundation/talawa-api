import type { PostResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const creatorId: PostResolvers["creatorId"] = async (parent) => {
  return await User.findOne({
    _id: parent.creatorId,
  }).lean();
};
