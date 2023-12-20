import type { CommentResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const createdBy: CommentResolvers["createdBy"] = async (parent) => {
  return await User.findOne({
    _id: parent.createdBy,
  }).lean();
};
