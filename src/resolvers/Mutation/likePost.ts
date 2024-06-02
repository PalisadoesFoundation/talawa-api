import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { Post } from "../../models";
import { errors, requestContext } from "../../libraries";
import { POST_NOT_FOUND_ERROR } from "../../constants";
import { findPostsInCache } from "../../services/PostCache/findPostsInCache";
import { cachePosts } from "../../services/PostCache/cachePosts";
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
export const likePost: MutationResolvers["likePost"] = async (
  _parent,
  args,
  context,
) => {
  let post;

  const postFoundInCache = await findPostsInCache([args.id]);

  post = postFoundInCache[0];

  if (postFoundInCache.includes(null)) {
    post = await Post.findOne({
      _id: args.id,
    }).lean();

    if (post !== null) {
      await cachePosts([post]);
    }
  }

  // Checks whether post exists.
  if (!post) {
    throw new errors.NotFoundError(
      requestContext.translate(POST_NOT_FOUND_ERROR.MESSAGE),
      POST_NOT_FOUND_ERROR.CODE,
      POST_NOT_FOUND_ERROR.PARAM,
    );
  }

  const currentUserHasLikedPost = post.likedBy.some((likedByUser) =>
    likedByUser.equals(context.userId),
  );

  // Checks whether currentUser with _id === context.userId has not already liked the post.
  if (currentUserHasLikedPost === false) {
    /*
    Adds context.userId to likedBy list and increases likeCount field by 1
    of post's document and returns the updated post.
    */
    const updatedPost = await Post.findOneAndUpdate(
      {
        _id: args.id,
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

    if (updatedPost !== null) {
      await cachePosts([updatedPost]);
    }

    return updatedPost;
  }

  // Returns the post without liking.
  return post;
};
