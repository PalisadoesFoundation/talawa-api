import type { PostResolvers } from "../../types/generatedGraphQLTypes";
import { Comment } from "../../models";
import { cacheComments } from "../../services/CommentCache/cacheComments";

export const comments: PostResolvers["comments"] = async (parent) => {
  const comment = await Comment.find({
    postId: parent._id,
  }).lean();

  cacheComments(comment)


  return comment
};
