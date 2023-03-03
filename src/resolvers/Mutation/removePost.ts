import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Post } from "../../models";
import {
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
  POST_NOT_FOUND_CODE,
  POST_NOT_FOUND_MESSAGE,
  POST_NOT_FOUND_PARAM,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_PARAM,
} from "../../constants";

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
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
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
      requestContext.translate(POST_NOT_FOUND_MESSAGE),
      POST_NOT_FOUND_CODE,
      POST_NOT_FOUND_PARAM
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
      requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
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
