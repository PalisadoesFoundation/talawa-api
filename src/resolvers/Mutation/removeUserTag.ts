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
