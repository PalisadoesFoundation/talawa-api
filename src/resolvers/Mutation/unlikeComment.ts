import { COMMENT_NOT_FOUND_ERROR } from "../../constants";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { Comment } from "../../models";
import { findCommentsInCache } from "../../services/CommentCache/findCommentsInCache";
import { cacheComments } from "../../services/CommentCache/cacheComments";
/**
 * This function enables to unlike a comment.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the comment exists
 * @returns Comment.
 */
export const unlikeComment: MutationResolvers["unlikeComment"] = async (
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

  if (!comment) {
    throw new errors.NotFoundError(
      requestContext.translate(COMMENT_NOT_FOUND_ERROR.MESSAGE),
      COMMENT_NOT_FOUND_ERROR.CODE,
      COMMENT_NOT_FOUND_ERROR.PARAM,
    );
  }

  const currentUserHasLikedComment = comment.likedBy.some((liker) =>
    liker.equals(context.userId),
  );

  if (currentUserHasLikedComment === true) {
    const updatedComment = await Comment.findOneAndUpdate(
      {
        _id: args.id,
      },
      {
        $pull: {
          likedBy: context.userId,
        },
        $inc: {
          likeCount: -1,
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

  return comment;
};
