import { CommentResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const creator: CommentResolvers["creator"] = async (parent) => {
  return await User.find({
    _id: parent.creator,
  }).lean();
};
