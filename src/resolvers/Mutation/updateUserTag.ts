import { Types } from "mongoose";
import {
  NO_CHANGE_IN_TAG_NAME,
  TAG_ALREADY_EXISTS,
  TAG_NOT_FOUND,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceAppUserProfile, InterfaceUser } from "../../models";
import { AppUserProfile, OrganizationTagUser, User } from "../../models";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
/**
 * Updates an existing tag's name based on provided input, including validation and authorization checks.
 *
 * This function updates the name of an existing tag in the database. It performs various checks to ensure that the current user is authorized to update the tag, validates that the new tag name is not the same as the old one, and ensures that no other tag with the same name exists under the same parent tag. It then updates the tag's name and returns the updated tag.
 *
 * @param _parent - This parameter represents the parent resolver in the GraphQL schema and is not used in this function.
 * @param args - The arguments passed to the GraphQL mutation, including the tag's `id` and the new `name` for the tag.
 * @param context - Provides contextual information, including the current user's ID. This is used to authenticate and authorize the request.
 *
 * @returns The updated tag with its new name.
 *
 */
export const updateUserTag: MutationResolvers["updateUserTag"] = async (
  _parent,
  args,
  context,
) => {
  let currentUser: InterfaceUser | null;
  const userFoundInCache = await findUserInCache([context.userId]);
  currentUser = userFoundInCache[0];
  if (currentUser === null) {
    currentUser = await User.findOne({
      _id: context.userId,
    }).lean();
    if (currentUser !== null) {
      await cacheUsers([currentUser]);
    }
  }

  // Checks whether currentUser exists.
  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }
  let currentUserAppProfile: InterfaceAppUserProfile | null;
  const appUserProfileFoundInCache = await findAppUserProfileCache([
    currentUser.appUserProfileId?.toString(),
  ]);
  currentUserAppProfile = appUserProfileFoundInCache[0];
  if (currentUserAppProfile === null) {
    currentUserAppProfile = await AppUserProfile.findOne({
      userId: currentUser._id,
    }).lean();
    if (currentUserAppProfile !== null) {
      await cacheAppUserProfile([currentUserAppProfile]);
    }
  }
  if (!currentUserAppProfile) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  // Get the tag object
  const existingTag = await OrganizationTagUser.findOne({
    _id: args.input.tagId,
  }).lean();

  if (!existingTag) {
    throw new errors.NotFoundError(
      requestContext.translate(TAG_NOT_FOUND.MESSAGE),
      TAG_NOT_FOUND.CODE,
      TAG_NOT_FOUND.PARAM,
    );
  }

  // Boolean to determine whether user is an admin of organization of the tag folder.
  const currentUserIsOrganizationAdmin = currentUserAppProfile.adminFor.some(
    (organization) =>
      organization &&
      new Types.ObjectId(organization.toString()).equals(
        existingTag?.organizationId,
      ),
  );

  // Checks whether currentUser can update the tag
  if (!currentUserAppProfile.isSuperAdmin && !currentUserIsOrganizationAdmin) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  // Throw error if the new tag name is the same as the old one
  if (existingTag.name === args.input.name) {
    throw new errors.ConflictError(
      requestContext.translate(NO_CHANGE_IN_TAG_NAME.MESSAGE),
      NO_CHANGE_IN_TAG_NAME.CODE,
      NO_CHANGE_IN_TAG_NAME.PARAM,
    );
  }

  // Check if another tag with the new name exists under the same parent tag
  const anotherTagExists = await OrganizationTagUser.exists({
    name: args.input.name,
    parentTagId: existingTag.parentTagId,
    organizationId: existingTag.organizationId,
  });

  if (anotherTagExists) {
    throw new errors.ConflictError(
      requestContext.translate(TAG_ALREADY_EXISTS.MESSAGE),
      TAG_ALREADY_EXISTS.CODE,
      TAG_ALREADY_EXISTS.PARAM,
    );
  }

  // Update the title of the tag and return it
  return await OrganizationTagUser.findOneAndUpdate(
    {
      _id: args.input.tagId,
    },
    {
      name: args.input.name,
    },
    {
      new: true,
    },
  ).lean();
};
