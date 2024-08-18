import { Types } from "mongoose";
import {
  TAG_NOT_FOUND,
  USER_DOES_NOT_HAVE_THE_TAG,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceAppUserProfile, InterfaceUser } from "../../models";
import {
  AppUserProfile,
  OrganizationTagUser,
  TagUser,
  User,
} from "../../models";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Unassigns a tag from a user in an organization.
 *
 * This function removes a specific tag from a user in an organization.
 * It checks whether the current user has the necessary permissions to unassign the tag and
 * verifies if the tag and the user exist in the system. If the tag is not currently assigned
 * to the user, an error is thrown.
 *
 * The function performs the following steps:
 * 1. Attempts to find the current user in the cache or database.
 * 2. Verifies if the current user exists.
 * 3. Attempts to find the current user's profile in the cache or database.
 * 4. Checks if the current user has the necessary permissions to unassign the tag.
 * 5. Fetches the tag that needs to be unassigned.
 * 6. Checks if the user to whom the tag is assigned exists.
 * 7. Ensures that the tag is actually assigned to the user.
 * 8. Removes the tag assignment from the user.
 *
 * @param _parent - This parameter is not used in this resolver function.
 * @param args - The arguments provided by the GraphQL query, specifically containing the user ID and tag ID to unassign.
 * @param context - The context of the request, containing information about the currently authenticated user.
 *
 * @returns  The user from whom the tag was unassigned.
 */

export const unassignUserTag: MutationResolvers["unassignUserTag"] = async (
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

  // Checks whether the currentUser exists.
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

  // Get all the child tags of the current tag (including itself)
  // on the OrganizationTagUser model
  // The following implementation makes number of queries = max depth of nesting in the tag provided
  let allTagIds: string[] = [];
  let currentParents = [tag._id.toString()];

  while (currentParents.length) {
    allTagIds = allTagIds.concat(currentParents);
    const foundTags = await OrganizationTagUser.find(
      {
        organizationId: tag.organizationId,
        parentTagId: {
          $in: currentParents,
        },
      },
      {
        _id: 1,
      },
    );
    currentParents = foundTags
      .map((tag) => tag._id.toString())
      .filter((id: string | null) => id);
  }

  // Unassign the tag
  await TagUser.deleteMany({
    tagId: {
      $in: allTagIds,
    },
    userId: args.input.userId,
  });

  return requestUser;
};
