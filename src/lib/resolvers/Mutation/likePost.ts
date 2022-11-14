import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { User, Post } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  IN_PRODUCTION,
  POST_NOT_FOUND,
  POST_NOT_FOUND_CODE,
  POST_NOT_FOUND_MESSAGE,
  POST_NOT_FOUND_PARAM,
  USER_NOT_FOUND,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
} from "../../../constants";
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

  const post = await Post.findOne({
    _id: args.id,
  }).lean();

  // Checks whether post exists.
  if (!post) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? POST_NOT_FOUND
        : requestContext.translate(POST_NOT_FOUND_MESSAGE),
      POST_NOT_FOUND_CODE,
      POST_NOT_FOUND_PARAM
    );
  }

  const currentUserHasLikedPost = post.likedBy.some(
    (likedByUser) => likedByUser.toString() === context.userId.toString()
  );

  // Checks whether currentUser with _id === context.userId has not already liked the post.
  if (currentUserHasLikedPost === false) {
    /*
    Adds context.userId to likedBy list and increases likeCount field by 1
    of post's document and returns the updated post.
    */
    return await Post.findOneAndUpdate(
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
      }
    ).lean();
  }

  // Returns the post without liking.
  return post;
};
