import { Types } from "mongoose";
import {
  TAG_NOT_FOUND,
  USER_ALREADY_HAS_TAG,
  USER_DOES_NOT_BELONG_TO_TAGS_ORGANIZATION,
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

/**
 * This function enables an admin to assign tag to user or not.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the user has appProfile.
 * 3. If the tag object exists.
 * 4. If the user is an admin for the organization.
 * 5. If the user to be assigned the tag exists.
 * 6. If the user to be assigned the tag belongs to the tag's organization.
 * 7. If the user already has the tag.
 * @returns User to which the tag is assigned.
 */

export const assignUserTag: MutationResolvers["assignUserTag"] = async (
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
    (orgId) =>
      orgId && new Types.ObjectId(orgId.toString()).equals(tag.organizationId),
  );
  //check whether current user can assign tag to user or not
  if (!(currentUserIsOrganizationAdmin || currentUserAppProfile.isSuperAdmin)) {
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

  // Check that the user to which the tag is to be assigned is a member of the tag's organization
  const requestUserBelongsToTagOrganization =
    requestUser.joinedOrganizations.some((organization) =>
      organization.equals(tag.organizationId),
    );

  if (!requestUserBelongsToTagOrganization) {
    throw new errors.UnauthorizedError(
      requestContext.translate(
        USER_DOES_NOT_BELONG_TO_TAGS_ORGANIZATION.MESSAGE,
      ),
      USER_DOES_NOT_BELONG_TO_TAGS_ORGANIZATION.CODE,
      USER_DOES_NOT_BELONG_TO_TAGS_ORGANIZATION.PARAM,
    );
  }

  // Check if the user already has been assigned the tag
  const userAlreadyHasTag = await TagUser.exists({
    ...args.input,
  });

  if (userAlreadyHasTag) {
    throw new errors.ConflictError(
      requestContext.translate(USER_ALREADY_HAS_TAG.MESSAGE),
      USER_ALREADY_HAS_TAG.CODE,
      USER_ALREADY_HAS_TAG.PARAM,
    );
  }

  // Assign the tag
  await TagUser.create({
    ...args.input,
  });

  return requestUser;
};
