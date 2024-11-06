import { Types } from "mongoose";
import {
  TAG_NOT_FOUND,
  USER_DOES_NOT_BELONG_TO_TAGS_ORGANIZATION,
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
 * This function enables an admin to assign a tag to multiple users.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the current user exists and has a profile.
 * 2. If the tag object exists.
 * 3. If the current user is an admin for the organization of the tag.
 * 4. If each user to be assigned the tag exists and belongs to the tag's organization.
 * 5. Assign the tag only to users who do not already have it.
 * @returns Array of users to whom the tag was assigned.
 */

export const addPeopleToUserTag: MutationResolvers["addPeopleToUserTag"] =
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

    // Boolean to determine whether user is an admin of the organization of the tag.
    const currentUserIsOrganizationAdmin = currentUserAppProfile.adminFor.some(
      (orgId) =>
        orgId &&
        new Types.ObjectId(orgId.toString()).equals(tag.organizationId),
    );
    //check whether current user can assign tag to users or not
    if (
      !(currentUserIsOrganizationAdmin || currentUserAppProfile.isSuperAdmin)
    ) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    // Check if the request users exist
    const requestUsers = await User.find({
      _id: { $in: args.input.userIds },
    }).lean();

    const requestUserMap = new Map(
      requestUsers.map((user) => [user._id.toString(), user]),
    );

    // Validate each user to be assigned the tag
    const validRequestUsers = [];
    for (const userId of args.input.userIds) {
      const requestUser = requestUserMap.get(userId);

      if (!requestUser) {
        throw new errors.NotFoundError(
          requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
          USER_NOT_FOUND_ERROR.CODE,
          USER_NOT_FOUND_ERROR.PARAM,
        );
      }

      // Check that the user to which the tag is to be assigned is a member of the tag's organization
      const requestUserBelongsToTagOrganization =
        requestUser.joinedOrganizations.some((orgId) =>
          orgId.equals(tag.organizationId),
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

      validRequestUsers.push(requestUser);
    }

    // Check existing tag assignments
    const existingTagAssignments = await TagUser.find({
      userId: { $in: validRequestUsers.map((user) => user._id) },
      tagId: tag._id,
    }).lean();

    const existingAssignmentsMap = existingTagAssignments.map((assign) =>
      assign.userId.toString(),
    );

    // Filter out users who already have the tag
    const newAssignments = validRequestUsers.filter(
      (user) => !existingAssignmentsMap.includes(user._id.toString()),
    );

    if (newAssignments.length === 0) {
      return tag; // No new assignments to be made
    }

    // Assign all the ancestor tags
    const allAncestorTags = [tag._id];
    let currentTag = tag;
    while (currentTag?.parentTagId) {
      const currentParentTag = await OrganizationTagUser.findOne({
        _id: currentTag.parentTagId,
      }).lean();

      if (currentParentTag) {
        allAncestorTags.push(currentParentTag?._id);
        currentTag = currentParentTag;
      }
    }

    const tagUserDocs = newAssignments.flatMap((user) =>
      allAncestorTags.map((tagId) => ({
        updateOne: {
          filter: { userId: user._id, tagId },
          update: {
            $setOnInsert: {
              userId: user._id,
              tagId,
              organizationId: tag.organizationId,
            },
          },
          upsert: true,
          setDefaultsOnInsert: true,
        },
      })),
    );

    if (tagUserDocs.length > 0) {
      await TagUser.bulkWrite(tagUserDocs);
    }

    return tag;
  };
