import { PostResolvers } from "../../types/generatedGraphQLTypes";
import { CommentPost } from "../../models";

export const comments: PostResolvers["comments"] = async (parent) => {
  const commentPostObjects = await CommentPost.find({
    _postId: parent._id,
  })
    .populate("commentId")
    .lean();

  return commentPostObjects.map((commentPost) => commentPost.commentId);
};
