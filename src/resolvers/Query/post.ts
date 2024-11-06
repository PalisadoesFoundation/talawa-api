import { POST_NOT_FOUND_ERROR } from "../../constants";
import { errors } from "../../libraries";
import { Post } from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
/**
 * This query will fetch the specified Post from the database.
 * @param _parent-
 * @param args - An object that contains `id` of the Post.
 * @returns An object `post`. If the `appLanguageCode` field not found then it throws a `NotFoundError` error.
 */
export const post: QueryResolvers["post"] = async (_parent, args) => {
  const post = await Post.findOne({ _id: args.id })
    .populate("organization")
    .populate(["likedBy", "file"])
    .lean();

  if (!post) {
    throw new errors.NotFoundError(
      POST_NOT_FOUND_ERROR.DESC,
      POST_NOT_FOUND_ERROR.CODE,
      POST_NOT_FOUND_ERROR.PARAM,
    );
  }

  return post;
};
