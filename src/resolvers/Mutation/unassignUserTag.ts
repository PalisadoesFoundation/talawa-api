import { Types } from "mongoose";
import {
  TAG_NOT_FOUND,
  USER_DOES_NOT_HAVE_THE_TAG,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import {
  AppUserProfile,
  OrganizationTagUser,
  TagUser,
  User,
} from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

export const unassignUserTag: MutationResolvers["unassignUserTag"] = async (
  _parent,
  args,
  context,
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  }).lean();

  // Checks whether the currentUser exists.
  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }
  const currentUserAppProfile = await AppUserProfile.findOne({
    userId: currentUser._id,
  }).lean();
  if (!currentUserAppProfile) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  // Get the tag object
  const tag = await OrganizationTagUser.findOne({
    _id: args.input.tagId,
  }).lean();

  if (!tag) {
    throw new errors.NotFoundError(
      requestContext.translate(TAG_NOT_FOUND.MESSAGE),
      TAG_NOT_FOUND.CODE,
      TAG_NOT_FOUND.PARAM,
    );
  }

  // Boolean to determine whether user is an admin of organization of the tag.
  const currentUserIsOrganizationAdmin = currentUserAppProfile.adminFor.some(
    (organization) =>
      organization &&
      new Types.ObjectId(organization.toString()).equals(tag?.organizationId),
  );

  // Checks whether currentUser can assign the tag or not.
  if (!currentUserIsOrganizationAdmin && !currentUserAppProfile.isSuperAdmin) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  // Check if the request user (to whom the tag is to be assigned) exists
  const requestUser = await User.findOne({
    _id: args.input.userId,
  }).lean();

  if (!requestUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  // Check if the user already has been assigned the tag
  const userAlreadyHasTag = await TagUser.exists({
    ...args.input,
  });

  if (!userAlreadyHasTag) {
    throw new errors.ConflictError(
      requestContext.translate(USER_DOES_NOT_HAVE_THE_TAG.MESSAGE),
      USER_DOES_NOT_HAVE_THE_TAG.CODE,
      USER_DOES_NOT_HAVE_THE_TAG.PARAM,
    );
  }

  // Unassign the tag
  await TagUser.deleteOne({
    ...args.input,
  });

  return requestUser;
};
