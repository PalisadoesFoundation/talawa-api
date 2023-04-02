import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Post, Comment } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  USER_NOT_FOUND_ERROR,
  COMMENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../constants";
/**
 * This function enables to remove a comment.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the comment exists.
 * 3. If the user is the creator of the organization.
 * @returns Deleted comment.
 */
export const removeComment: MutationResolvers["removeComment"] = async (
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

  const comment = await Comment.findOne({
    _id: args.input.commentId,
  }).lean();

  // Checks whether comment exists.
  if (!comment) {
    throw new errors.NotFoundError(
      requestContext.translate(COMMENT_NOT_FOUND_ERROR.MESSAGE),
      COMMENT_NOT_FOUND_ERROR.CODE,
      COMMENT_NOT_FOUND_ERROR.PARAM
    );
  }

  // Checks whether currentUser with _id === context.userId is not the creator of comment.
  if (comment.creator.toString() !== context.userId.toString()) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  /*
  Removes comment._id from comments list and reduces commentCount
  by 1 of post with _id === comment.post
  */
  await Post.updateOne(
    {
      _id: comment.post,
    },
    {
      $pull: {
        comments: comment._id,
      },
      $inc: {
        commentCount: -1,
      },
    }
  );

  // Deletes the comment.
  await Comment.deleteOne({
    _id: comment._id,
  });

  // Returns the deleted comment.
  return comment;
};
