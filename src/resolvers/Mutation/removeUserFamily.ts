import {
  USER_FAMILY_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { UserFamily } from "../../models/userFamily";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

import { AppUserProfile, User } from "../../models";
import type { InterfaceAppUserProfile } from "../../models";
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

  const currentUser = await User.findOne({
    _id: context.userId,
  });

  // Checks whether currentUser exists.
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
