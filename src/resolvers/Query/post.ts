import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Post } from "../../models";
import { errors } from "../../libraries";
import { POST_NOT_FOUND_ERROR } from "../../constants";
/**
 * This query will fetch the specified Post from the database.
 * @param _parent -
 * @param args - An object that contains `id` of the Post.
 * @returns An object `post`. If the `appLanguageCode` field not found then it throws a `NotFoundError` error.
 */
export const post: QueryResolvers["post"] = async (_parent, args) => {
  const post = await Post.findOne({ _id: args.id })
    .populate("organization")
    .populate({
      path: "comments",
      populate: {
        path: "creator",
      },
    })
    .populate("likedBy")
    .populate("creator", "-password")
    .lean();

  if (!post) {
    throw new errors.NotFoundError(
      POST_NOT_FOUND_ERROR.DESC,
      POST_NOT_FOUND_ERROR.CODE,
      POST_NOT_FOUND_ERROR.PARAM
    );
  }

  post.likeCount = post.likedBy.length || 0;
  post.commentCount = post.comments.length || 0;

  return post;
};
