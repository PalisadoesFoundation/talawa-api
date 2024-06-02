import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { Comment } from "../../models";
import { errors, requestContext } from "../../libraries";
import { COMMENT_NOT_FOUND_ERROR } from "../../constants";
import { findCommentsInCache } from "../../services/CommentCache/findCommentsInCache";
import { cacheComments } from "../../services/CommentCache/cacheComments";
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
  context,
) => {
  let comment;

  const commentsFoundInCache = await findCommentsInCache([args.id]);

  comment = commentsFoundInCache[0];

  if (commentsFoundInCache.includes(null)) {
    comment = await Comment.findOne({
      _id: args.id,
    }).lean();

    if (comment !== null) {
      await cacheComments([comment]);
    }
  }

  // Checks whether comment exists.
  if (!comment) {
    throw new errors.NotFoundError(
      requestContext.translate(COMMENT_NOT_FOUND_ERROR.MESSAGE),
      COMMENT_NOT_FOUND_ERROR.CODE,
      COMMENT_NOT_FOUND_ERROR.PARAM,
    );
  }

  const currentUserHasLikedComment = comment.likedBy.some((likedByUser) =>
    likedByUser.equals(context.userId),
  );

  // Checks whether currentUser with _id === context.userId has not already liked the comment.
  if (currentUserHasLikedComment === false) {
    /*
    Adds context.userId to likedBy list and increases likeCount field by 1
    of comment's document and returns the updated comment.
    */
    const updatedComment = await Comment.findOneAndUpdate(
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
      },
    ).lean();

    if (updatedComment !== null) {
      await cacheComments([updatedComment]);
    }

    return updatedComment;
  }

  // Returns the comment without liking.
  return comment;
};
