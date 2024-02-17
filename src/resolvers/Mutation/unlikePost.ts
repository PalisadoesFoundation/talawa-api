import { POST_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfacePost } from "../../models";
import { Post } from "../../models";
import { cachePosts } from "../../services/PostCache/cachePosts";
import { findPostsInCache } from "../../services/PostCache/findPostsInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
/**
 * This function enables to unlike a post.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the post exists
 * @returns Post.
 */
export const unlikePost: MutationResolvers["unlikePost"] = async (
  _parent,
  args,
  context,
) => {
  let post: InterfacePost | null;

  const postFoundInCache = await findPostsInCache([args.id]);

  post = postFoundInCache[0];

  if (postFoundInCache[0] === null) {
    post = await Post.findOne({
      _id: args.id,
    }).lean();
    if (post !== null) {
      await cachePosts([post]);
    }
  }

  if (!post) {
    throw new errors.NotFoundError(
      requestContext.translate(POST_NOT_FOUND_ERROR.MESSAGE),
      POST_NOT_FOUND_ERROR.CODE,
      POST_NOT_FOUND_ERROR.PARAM,
    );
  }

  const currentUserHasLikedPost = post.likedBy.some((liker) =>
    liker.equals(context.userId),
  );

  if (currentUserHasLikedPost === true) {
    const updatedPost = await Post.findOneAndUpdate(
      {
        _id: post._id,
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

    if (updatedPost !== null) {
      await cachePosts([updatedPost]);
    }

    return updatedPost;
  }

  return post;
};
