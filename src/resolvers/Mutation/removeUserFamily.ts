import {
  USER_FAMILY_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { UserFamily } from "../../models/userFamily";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

import type { InterfaceAppUserProfile, InterfaceUser } from "../../models";
import { AppUserProfile, User } from "../../models";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import { superAdminCheck } from "../../utilities";
/**
 * This function enables to remove a user family.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application.
 * @remarks - The following checks are done:
 * 1. If the user family exists.
 * 2. If the user is super admin.
 * @returns Deleted user family.
 */
export const removeUserFamily: MutationResolvers["removeUserFamily"] = async (
  _parent,
  args,
  context,
) => {
  const userFamily = await UserFamily.findOne({
    _id: args.familyId,
  }).lean();

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
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }
  // Check whether the user is super admin.
  superAdminCheck(currentUserAppProfile as InterfaceAppUserProfile);

  // Checks if a family with _id === args.familyId exists
  if (!userFamily) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_FAMILY_NOT_FOUND_ERROR.MESSAGE),
      USER_FAMILY_NOT_FOUND_ERROR.CODE,
      USER_FAMILY_NOT_FOUND_ERROR.PARAM,
    );
  }

  // Deletes the UserFamily.
  await UserFamily.deleteOne({
    _id: userFamily._id,
  });

  return userFamily;
};
