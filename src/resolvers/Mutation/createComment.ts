import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Post, Comment } from "../../models";
import { errors, requestContext } from "../../libraries";
import { USER_NOT_FOUND_ERROR } from "../../constants";
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
  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  // Creates new comment.
  const createdComment = await Comment.create({
    ...args.input.data,
    creator: context.userId,
    post: args.input.postId,
  });

  /*
  Adds createdComment._id to comments list and increases commentCount by 1
  on post's document with _id === args.postId.
  */
  await Post.updateOne(
    {
      _id: args.input.postId,
    },
    {
      $push: {
        comments: createdComment._id,
      },
      $inc: {
        commentCount: 1,
      },
    }
  );

  // Returns the createdComment.
  return createdComment.toObject();
};
