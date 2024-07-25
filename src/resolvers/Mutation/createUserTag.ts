import { Types } from "mongoose";
import {
  INCORRECT_TAG_INPUT,
  ORGANIZATION_NOT_FOUND_ERROR,
  TAG_ALREADY_EXISTS,
  TAG_NOT_FOUND,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_AUTHORIZED_TO_CREATE_TAG,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceAppUserProfile, InterfaceUser } from "../../models";
import {
  AppUserProfile,
  Organization,
  OrganizationTagUser,
  User,
} from "../../models";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Creates a new tag for an organization if the user is authorized to do so.
 *
 * This resolver performs the following steps:
 *
 * 1. Verifies that the current user exists and is fetched from the cache or database.
 * 2. Checks if the current user has an application profile.
 * 3. Ensures the current user is authorized to create a tag by being either a super admin or an admin for the specified organization.
 * 4. Checks if the provided organization exists.
 * 5. Validates that the parent tag (if provided) belongs to the specified organization.
 * 6. Ensures no other tag with the same name exists under the same parent tag.
 * 7. Creates a new tag if all validation checks pass.
 *
 * @param _parent - The parent object, not used in this resolver.
 * @param args - The input arguments for the mutation, including the tag details and organization ID.
 * @param context - The context object, including the user ID and other necessary context for authorization.
 *
 * @returns The created tag object.
 *
 * @remarks This function is intended for creating new tags within an organization and includes validation to ensure the integrity of the tag creation process.
 */
export const createUserTag: MutationResolvers["createUserTag"] = async (
  _parent,
  args,
  context,
) => {
  // Get the current user
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

  // Check whether current User has app profile or not
  if (!currentUserAppProfile) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  // Checks if the provided organization exists
  const organizationExists = await Organization.exists({
    _id: args.input.organizationId,
  });

  if (!organizationExists) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM,
    );
  }

  // Check if the user has privileges to create the tag
  const currentUserIsOrganizationAdmin = currentUserAppProfile.adminFor.some(
    (organizationId) =>
      new Types.ObjectId(organizationId?.toString()).equals(
        args.input.organizationId,
      ),
  );

  if (!currentUserAppProfile.isSuperAdmin && !currentUserIsOrganizationAdmin) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_TO_CREATE_TAG.MESSAGE),
      USER_NOT_AUTHORIZED_TO_CREATE_TAG.CODE,
      USER_NOT_AUTHORIZED_TO_CREATE_TAG.PARAM,
    );
  }

  // Additional checks if the parent folder is provided
  if (args.input.parentTagId) {
    const parentTag = await OrganizationTagUser.findOne({
      _id: args.input.parentTagId,
    });

    // Throw an error if the parent tag folder does not exist
    if (!parentTag) {
      throw new errors.NotFoundError(
        requestContext.translate(TAG_NOT_FOUND.MESSAGE),
        TAG_NOT_FOUND.CODE,
        TAG_NOT_FOUND.PARAM,
      );
    }

    // The parent folder should belong to the provided organization
    if (
      args.input.organizationId.toString() !==
      parentTag.organizationId.toString()
    ) {
      throw new errors.NotFoundError(
        requestContext.translate(INCORRECT_TAG_INPUT.MESSAGE),
        INCORRECT_TAG_INPUT.CODE,
        INCORRECT_TAG_INPUT.PARAM,
      );
    }
  }

  // Check if another tag with the same name exists under the same parent tag
  const anotherTagExists = await OrganizationTagUser.exists({
    ...args.input,
  });

  if (anotherTagExists) {
    throw new errors.ConflictError(
      requestContext.translate(TAG_ALREADY_EXISTS.MESSAGE),
      TAG_ALREADY_EXISTS.CODE,
      TAG_ALREADY_EXISTS.PARAM,
    );
  }

  // Creates new tag and returns the same
  const newTag = await OrganizationTagUser.create({
    ...args.input,
  });

  return newTag.toObject();
};
