import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { Post, Comment } from "../../models";
import { errors, requestContext } from "../../libraries";
import { POST_NOT_FOUND_ERROR } from "../../constants";
import { cacheComments } from "../../services/CommentCache/cacheComments";
import { cachePosts } from "../../services/PostCache/cachePosts";

/**
 * Creates a new comment and associates it with the specified post.
 *
 * This function performs the following actions:
 * 1. Verifies that the post specified by `postId` exists.
 * 2. Creates a new comment associated with the post.
 * 3. Increments the `commentCount` for the post by 1.
 * 4. Caches the newly created comment and updated post data.
 *
 * @param _parent - The parent object for the mutation. This parameter is not used in this resolver.
 * @param args - The arguments for the mutation, including:
 *   - `postId`: The ID of the post to which the comment will be associated.
 *   - `data`: The comment data, including the content of the comment.
 * @param context - The context for the mutation, including:
 *   - `userId`: The ID of the current user creating the comment.
 *
 * @returns The created comment.
 *
 */
export const createComment: MutationResolvers["createComment"] = async (
  _parent,
  args,
  context,
) => {
  // Check if the provided post exists
  const postExists = await Post.exists({
    _id: args.postId,
  });

  if (!postExists) {
    throw new errors.NotFoundError(
      requestContext.translate(POST_NOT_FOUND_ERROR.MESSAGE),
      POST_NOT_FOUND_ERROR.CODE,
      POST_NOT_FOUND_ERROR.PARAM,
    );
  }

  // Creates the new comment
  const createdComment = await Comment.create({
    ...args.data,
    creatorId: context.userId,
    postId: args.postId,
  });

  await cacheComments([createdComment]);

  // Increase commentCount by 1 on post's document with _id === args.postId.
  const updatedPost = await Post.findOneAndUpdate(
    {
      _id: args.postId,
    },
    {
      $inc: {
        commentCount: 1,
      },
    },
    {
      new: true,
    },
  );

  if (updatedPost !== null) {
    await cachePosts([updatedPost]);
  }

  // Returns the createdComment.
  return createdComment.toObject();
};
