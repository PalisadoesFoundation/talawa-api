import { Types } from "mongoose";
import { POST_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";
import { Post } from "../../models";

/**
 * Throws error if there exists no `Post`a with the given `id` else returns matching `Post` document
 * @param postId - `id` of the desried post
 */
export const getValidPostById = async (postId: string | Types.ObjectId) => {
  const post = await Post.findOne({
    _id: postId,
  }).lean();

  if (!post) {
    throw new errors.NotFoundError(
      requestContext.translate(POST_NOT_FOUND_ERROR.MESSAGE),
      POST_NOT_FOUND_ERROR.CODE,
      POST_NOT_FOUND_ERROR.PARAM
    );
  }

  return post;
};
