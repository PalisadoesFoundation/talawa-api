import type { Types } from "mongoose";
import mongoose from "mongoose";
import { USER_NOT_AUTHORIZED_ADMIN } from "../constants";
import { errors, requestContext } from "../libraries";
import type { InterfaceOrganization } from "../models";
import { AppUserProfile } from "../models";

/**
 * Checks if the current user is an admin of the organization.
 * If the user is an admin, the function completes successfully. Otherwise, it throws an UnauthorizedError.
 * @remarks
 * This is a utility method.
 * @param userId - The ID of the current user. It can be a string or a Types.ObjectId.
 * @param organization - The organization data of `InterfaceOrganization` type.
 * @param throwError - A boolean value to determine if the function should throw an error. Default is `true`.
 * @returns `True` or `False`.
 */
export const adminCheck = async (
  userId: string | Types.ObjectId,
  organization: InterfaceOrganization,
  throwError: boolean = true,
): Promise<boolean> => {
  /**
   * Check if the user is listed as an admin in the organization.
   * Compares the user ID with the admin IDs in the organization.
   */
  const userIsOrganizationAdmin = organization.admins.some(
    (admin) =>
      admin === userId ||
      new mongoose.Types.ObjectId(admin).toString() === userId.toString(),
  );

  /**
   * Fetch the user's profile from the AppUserProfile collection.
   */
  const userAppProfile = await AppUserProfile.findOne({
    userId,
  }).lean();

  /**
   * If the user's profile is not found, throw an UnauthorizedError.
   */
  if (!userAppProfile) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ADMIN.MESSAGE),
      USER_NOT_AUTHORIZED_ADMIN.CODE,
      USER_NOT_AUTHORIZED_ADMIN.PARAM,
    );
  }

  /**
   * Check if the user has super admin privileges.
   */
  const isUserSuperAdmin: boolean = userAppProfile.isSuperAdmin;

  /**
   * If the user is neither an organization admin nor a super admin, throw an UnauthorizedError.
   */
  if (!userIsOrganizationAdmin && !isUserSuperAdmin) {
    if (throwError) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ADMIN.MESSAGE),
        USER_NOT_AUTHORIZED_ADMIN.CODE,
        USER_NOT_AUTHORIZED_ADMIN.PARAM,
      );
    } else {
      return false;
    }
  }
  return true;
};
