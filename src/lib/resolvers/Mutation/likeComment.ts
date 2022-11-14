import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { User, Comment } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  COMMENT_NOT_FOUND,
  COMMENT_NOT_FOUND_CODE,
  COMMENT_NOT_FOUND_MESSAGE,
  COMMENT_NOT_FOUND_PARAM,
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
} from "../../../constants";
/**
 * This function enables to like a comment.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the comment exists
 * 3. If the user has already liked the comment.
 * @returns Comment without the like
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
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  const comment = await Comment.findOne({
    _id: args.id,
  }).lean();

  // Checks whether comment exists.
  if (!comment) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? COMMENT_NOT_FOUND
        : requestContext.translate(COMMENT_NOT_FOUND_MESSAGE),
      COMMENT_NOT_FOUND_CODE,
      COMMENT_NOT_FOUND_PARAM
    );
  }

  const currentUserHasLikedComment = comment.likedBy.some(
    (likedByUser) => likedByUser.toString() === context.userId.toString()
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
