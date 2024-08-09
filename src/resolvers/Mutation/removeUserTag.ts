import { Types } from "mongoose";
import {
  TAG_NOT_FOUND,
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
 * Removes a user tag from an organization.
 *
 * This function removes a specific tag associated with a user in an organization.
 * It checks whether the user has the proper authorization to delete the tag.
 * It also handles cases where the user or the tag is not found in the system.
 *
 * The function performs the following steps:
 * 1. Attempts to find the user in the cache or database.
 * 2. Verifies if the user exists.
 * 3. Attempts to find the user's profile in the cache or database.
 * 4. Checks if the user has the necessary permissions to delete the tag.
 * 5. Fetches the tag that needs to be deleted.
 * 6. Retrieves all child tags (including the parent tag) related to the organization.
 * 7. Deletes all related tags from the organization and user tag entries.
 *
 * @param _parent - This parameter is not used in this resolver function.
 * @param args - The arguments provided by the GraphQL query, specifically containing the ID of the tag to be removed.
 * @param context - The context of the request, containing information about the currently authenticated user.
 *
 * @returns The tag that was deleted.
 */

export const removeUserTag: MutationResolvers["removeUserTag"] = async (
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
  const tag = await OrganizationTagUser.findOne({
    _id: args.id,
  });

  if (!tag) {
    throw new errors.NotFoundError(
      requestContext.translate(TAG_NOT_FOUND.MESSAGE),
      TAG_NOT_FOUND.CODE,
      TAG_NOT_FOUND.PARAM,
    );
  }

  // Boolean to determine whether user is an admin of organization of the tag
  const currentUserIsOrganizationAdmin = currentUserAppProfile.adminFor.some(
    (organization) =>
      organization &&
      new Types.ObjectId(organization.toString()).equals(tag.organizationId),
  );

  // Checks whether currentUser cannot delete the tag folder.
  if (!currentUserAppProfile.isSuperAdmin && !currentUserIsOrganizationAdmin) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
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

  // Delete all the tags
  await OrganizationTagUser.deleteMany({
    _id: {
      $in: allTagIds,
    },
  });

  // Delete all the tag entries in the TagUser model
  await TagUser.deleteMany({
    tagId: {
      $in: allTagIds,
    },
  });

  return tag;
};
