import type { PostResolvers } from "../../types/generatedGraphQLTypes";
import { Comment } from "../../models";
import { cacheComments } from "../../services/CommentCache/cacheComments";
import { findCommentsByPostIdInCache } from "../../services/CommentCache/findCommentsByPostIdInCache";

export const comments: PostResolvers["comments"] = async (parent) => {
  const commentsInCache = await findCommentsByPostIdInCache(parent._id);

  if (
    !commentsInCache.includes(null) &&
    commentsInCache.length === parent.commentCount
  ) {
    return commentsInCache;
  }

  const comment = await Comment.find({
    postId: parent._id,
  }).lean();

  cacheComments(comment);

  return comment;
};
