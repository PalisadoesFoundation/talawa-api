import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Post, Comment, CommentPost } from "../../models";
import { errors, requestContext } from "../../libraries";
import { POST_NOT_FOUND_ERROR, USER_NOT_FOUND_ERROR } from "../../constants";

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
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  // Checks whether currentUser with _id === context.userId exists.
  if (!currentUserExists) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

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
    creator: context.userId,
  });

  await CommentPost.create({
    postId: args.postId,
    commentId: createdComment._id,
  });

  // Increase commentCount by 1 on post's document with _id === args.postId.
  await Post.updateOne(
    {
      _id: args.postId,
    },
    {
      $inc: {
        commentCount: 1,
      },
    }
  );

  // Returns the createdComment.
  return createdComment.toObject();
};
