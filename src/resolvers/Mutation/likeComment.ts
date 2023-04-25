import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Comment } from "../../models";
import { errors, requestContext } from "../../libraries";
import { COMMENT_NOT_FOUND_ERROR, USER_NOT_FOUND_ERROR } from "../../constants";
/**
 * This function enables to like a post.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the post exists
 * 3. If the user has already liked the post.
 * @returns Post without the like
 */
export const likeComment: MutationResolvers["likeComment"] = async (
  _parent,
  args,
  context
) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  // Checks whether currentUser with _id == context.userId exists.
  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const comment = await Comment.findOne({
    _id: args.id,
  }).lean();

  // Checks whether comment exists.
  if (!comment) {
    throw new errors.NotFoundError(
      requestContext.translate(COMMENT_NOT_FOUND_ERROR.MESSAGE),
      COMMENT_NOT_FOUND_ERROR.CODE,
      COMMENT_NOT_FOUND_ERROR.PARAM
    );
  }

  const currentUserHasLikedComment = comment.likedBy.some((likedByUser) =>
    likedByUser.equals(context.userId)
  );

  // Checks whether currentUser with _id === context.userId has not already liked the comment.
  if (currentUserHasLikedComment === false) {
    /*
    Adds context.userId to likedBy list and increases likeCount field by 1
    of comment's document and returns the updated comment.
    */
    return await Comment.findOneAndUpdate(
      {
        _id: comment._id,
      },
      {
        $push: {
          likedBy: context.userId,
        },
        $inc: {
          likeCount: 1,
        },
      },
      {
        new: true,
      }
    ).lean();
  }

  // Returns the comment without liking.
  return comment;
};
