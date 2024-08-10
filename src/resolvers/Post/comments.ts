import type { PostResolvers } from "../../types/generatedGraphQLTypes";
import { Comment } from "../../models";
import { cacheComments } from "../../services/CommentCache/cacheComments";
import { findCommentsByPostIdInCache } from "../../services/CommentCache/findCommentsByPostIdInCache";

/**
 * Resolver function for the `comments` field of a `Post`.
 *
 * This function retrieves the comments associated with a specific post.
 *
 * @param parent - The parent object representing the post. It contains information about the post, including the ID of the comments associated with it.
 * @returns A promise that resolves to an array of comment documents found in the database. These documents represent the comments associated with the post.
 *
 * @see Comment - The Comment model used to interact with the comments collection in the database.
 * @see PostResolvers - The type definition for the resolvers of the Post fields.
 *
 */
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
