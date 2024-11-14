import type { Types } from "mongoose";
import mongoose from "mongoose";
import { USER_NOT_AUTHORIZED_ADMIN } from "../constants";
import { errors, requestContext } from "../libraries";
import { AppUserProfile } from "../models";
import type { InterfaceUserFamily } from "../models/userFamily";

/**
 * Checks if the current user is an admin of the organization or a super admin.
 * Throws an UnauthorizedError if the user is neither an admin nor a super admin.
 *
 * @remarks
 * This function queries the `userFamily` to check if the `userId` is listed as an admin.
 * Additionally, it queries the `AppUserProfile` to check if the `userId` is a super admin.
 *
 * @param userId - The ID of the current user.
 * @param userFamily - The user family data of type `InterfaceUserFamily`.
 */
export const adminCheck = async (
  userId: string | Types.ObjectId,
  userFamily: InterfaceUserFamily,
): Promise<void> => {
  // Check if the user is listed as an admin in userFamily
  const userIsUserFamilyAdmin = userFamily.admins.some(
    (admin) =>
      admin === userId ||
      new mongoose.Types.ObjectId(admin.toString()).equals(userId),
  );

  // Query AppUserProfile to check if the user is a super admin
  const appUserProfile = await AppUserProfile.findOne({
    userId: userId,
  });
  const isUserSuperAdmin: boolean = appUserProfile?.isSuperAdmin || false;

  // If the user is neither an admin nor a super admin, throw UnauthorizedError
  if (!userIsUserFamilyAdmin && !isUserSuperAdmin) {
    throw new errors.UnauthorizedError(
      requestContext.translate(`${USER_NOT_AUTHORIZED_ADMIN.MESSAGE}`),
      USER_NOT_AUTHORIZED_ADMIN.CODE,
      USER_NOT_AUTHORIZED_ADMIN.PARAM,
    );
  }
};
