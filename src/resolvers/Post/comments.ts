import { PostResolvers } from "../../types/generatedGraphQLTypes";
import { Comment } from "../../models";

export const comments: PostResolvers["comments"] = async (parent) => {
  return await Comment.find({
    postId: parent._id,
  }).lean();
};
