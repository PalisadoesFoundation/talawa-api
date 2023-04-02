import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Post, Organization } from "../../models";
import {
  USER_NOT_FOUND_ERROR,
  POST_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../constants";
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
  // Get the currentUser with _id === context.userId exists.
  const currentUser = await User.findOne({
    _id: context.userId,
  }).lean();

  // Get the currentUser with _id === context.userId exists.
  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const post = await Post.findOne({
    _id: args.input.id,
  }).lean();

  // Checks whether post exists.
  if (!post) {
    throw new errors.NotFoundError(
      requestContext.translate(POST_NOT_FOUND_ERROR.MESSAGE),
      POST_NOT_FOUND_ERROR.CODE,
      POST_NOT_FOUND_ERROR.PARAM
    );
  }

  // Checks whether currentUser is allowed to delete the post or not.
  const isCreator = post.creator.toString() === context.userId.toString();
  const isSuperAdmin = currentUser!.userType === "SUPERADMIN";
  const isAdminOfPostOrganization = currentUser!.adminFor.some(
    (orgID) => orgID.toString() === post.organization.toString()
  );

  if (!isCreator && !isSuperAdmin && !isAdminOfPostOrganization) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM
    );
  }

  // Deletes the post.
  await Post.deleteOne({
    _id: args.input.id,
  });

  // Removes the post from the organization, doesn't fail if the post wasn't pinned
  await Organization.updateOne(
    {
      _id: post.organization,
    },
    {
      $pull: {
        pinnedPosts: args.input.id,
      },
    }
  );

  // Returns deleted post.
  return post;
};
