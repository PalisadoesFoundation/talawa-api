import { Types } from "mongoose";
import { COMMENT_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";
import { Comment } from "../../models";

/**
 * Throws error if there exists no `Comment`a with the given `id` else returns matching `Comment` document
 * @param commentId - `id` of the desried comment
 */
export const getValidCommentById = async (
  commentId: string | Types.ObjectId
) => {
  const comment = await Comment.findOne({
    _id: commentId,
  }).lean();

  if (!comment) {
    throw new errors.NotFoundError(
      requestContext.translate(COMMENT_NOT_FOUND_ERROR.MESSAGE),
      COMMENT_NOT_FOUND_ERROR.CODE,
      COMMENT_NOT_FOUND_ERROR.PARAM
    );
  }

  return comment;
};
