import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { Post, Comment } from "../../models";
import { errors, requestContext } from "../../libraries";
import { POST_NOT_FOUND_ERROR, TRANSACTION_LOG_TYPES } from "../../constants";
import { cacheComments } from "../../services/CommentCache/cacheComments";
import { cachePosts } from "../../services/PostCache/cachePosts";
import { storeTransaction } from "../../utilities/storeTransaction";

/**
 * This function enables to create comment.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * @returns Created comment
 */
export const createComment: MutationResolvers["createComment"] = async (
  _parent,
  args,
  context
) => {
  // Check if the provided post exists
  const postExists = await Post.exists({
    _id: args.postId,
  });

  if (!postExists) {
    throw new errors.NotFoundError(
      requestContext.translate(POST_NOT_FOUND_ERROR.MESSAGE),
      POST_NOT_FOUND_ERROR.CODE,
      POST_NOT_FOUND_ERROR.PARAM
    );
  }

  // Creates the new comment
  const createdComment = await Comment.create({
    ...args.data,
    creatorId: context.userId,
    postId: args.postId,
  });
  await storeTransaction(
    context.userId,
    TRANSACTION_LOG_TYPES.CREATE,
    "Comment",
    `Comment:${createdComment._id} created`
  );

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
    }
  );
  await storeTransaction(
    context.userId,
    TRANSACTION_LOG_TYPES.UPDATE,
    "Post",
    `Post:${args.postId} updated commentCount`
  );

  if (updatedPost !== null) {
    await cachePosts([updatedPost]);
  }

  // Returns the createdComment.
  return createdComment.toObject();
};
