import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { errors, requestContext } from "../../libraries";
import { User, Post } from "../../models";
import {
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
  POST_NOT_FOUND,
  POST_NOT_FOUND_CODE,
  POST_NOT_FOUND_MESSAGE,
  POST_NOT_FOUND_PARAM,
  USER_NOT_AUTHORIZED,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_PARAM,
} from "../../../constants";
/**
 * This function enables to remove a post.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the post exists
 * 3. If the user is the creator of the post.
 * 4. If the user to be removed is a member of the organization.
 * @returns Deleted Post.
 */
export const removePost: MutationResolvers["removePost"] = async (
  _parent,
  args,
  context
) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  // Checks whether currentUser with _id === context.userId exists.
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

  // Checks whether currentUser with _id === context.userId is not the creator of post.
  if (post.creator.toString() !== context.userId.toString()) {
    throw new errors.UnauthorizedError(
      IN_PRODUCTION !== true
        ? USER_NOT_AUTHORIZED
        : requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
      USER_NOT_AUTHORIZED_CODE,
      USER_NOT_AUTHORIZED_PARAM
    );
  }

  // Deletes the post.
  await Post.deleteOne({
    _id: args.id,
  });

  // Returns deleted post.
  return post;
};
