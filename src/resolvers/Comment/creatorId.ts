import type { CommentResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const creatorId: CommentResolvers["creatorId"] = async (parent) => {
  return await User.findOne({
    _id: parent.creatorId,
  }).lean();
};
