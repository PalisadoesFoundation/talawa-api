import type { PostResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const creator: PostResolvers["creator"] = async (parent) => {
  return await User.findOne({
    _id: parent.creator,
  }).lean();
};
