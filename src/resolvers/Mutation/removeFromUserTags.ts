import { Types } from "mongoose";
import {
  TAG_NOT_FOUND,
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
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
 * This function enables an admin to remove multiple tags from users with a specified tag.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the current user exists and has a profile.
 * 2. If the current user is an admin for the organization of the tags.
 * 3. If the currentTagId exists and the selected tags exist.
 * 4. Remove the tags from users who have the currentTagId.
 * @returns Array of tags that were removed from users.
 */
export const removeFromUserTags: MutationResolvers["removeFromUserTags"] =
  async (_parent, args, context) => {
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
      currentUser.appUserProfileId.toString(),
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

    // Get the current tag object
    const currentTag = await OrganizationTagUser.findOne({
      _id: args.input.currentTagId,
    }).lean();

    if (!currentTag) {
      throw new errors.NotFoundError(
        requestContext.translate(TAG_NOT_FOUND.MESSAGE),
        TAG_NOT_FOUND.CODE,
        TAG_NOT_FOUND.PARAM,
      );
    }

    // Boolean to determine whether user is an admin of the organization of the current tag.
    const currentUserIsOrganizationAdmin = currentUserAppProfile.adminFor.some(
      (orgId) => orgId?.toString() === currentTag.organizationId.toString(),
    );

    if (
      !(currentUserIsOrganizationAdmin || currentUserAppProfile.isSuperAdmin)
    ) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    // Find selected tags & all users tagged with the current tag
    const [selectedTags, usersWithCurrentTag] = await Promise.all([
      OrganizationTagUser.find({
        _id: { $in: args.input.selectedTagIds },
      }).lean(),
      TagUser.find({ tagId: currentTag._id }).lean(),
    ]);

    const userIdsWithCurrentTag = usersWithCurrentTag.map(
      (userTag) => userTag.userId,
    );

    if (selectedTags.length !== args.input.selectedTagIds.length) {
      throw new errors.NotFoundError(
        requestContext.translate(TAG_NOT_FOUND.MESSAGE),
        TAG_NOT_FOUND.CODE,
        TAG_NOT_FOUND.PARAM,
      );
    }

    // Get all descendant tags of the selected tags (including the selected tags themselves)
    const allTagsToRemove = new Set<string>();
    let currentParents = selectedTags.map((tag) => tag._id.toString());

    while (currentParents.length > 0) {
      // Add the current level of tags to the set
      for (const parentId of currentParents) {
        allTagsToRemove.add(parentId);
      }

      // Find the next level of child tags
      const childTags = await OrganizationTagUser.find(
        {
          parentTagId: { $in: currentParents },
        },
        { _id: 1 },
      ).lean();

      // Update currentParents with the next level of children
      currentParents = childTags.map((tag) => tag._id.toString());
    }

    // Now allTagsToRemove contains all descendants of the selected tags

    const tagUserDocs = userIdsWithCurrentTag.flatMap((userId) =>
      Array.from(allTagsToRemove).map((tagId) => ({
        deleteOne: {
          filter: { userId, tagId: new Types.ObjectId(tagId) },
        },
      })),
    );

    if (tagUserDocs.length > 0) {
      await TagUser.bulkWrite(tagUserDocs);
    }

    return currentTag;
  };
