import type { CommentResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const creator: CommentResolvers["creator"] = async (parent) => {
  return await User.findOne({
    _id: parent.creator,
  }).lean();
};
