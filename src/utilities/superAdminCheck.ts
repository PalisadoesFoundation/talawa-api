import { USER_NOT_AUTHORIZED_SUPERADMIN } from "../constants";
import { errors, requestContext } from "../libraries";
import type { InterfaceAppUserProfile } from "../models";

/**
 * Checks if the provided application user profile is a super admin.
 * Throws an UnauthorizedError if the user is not a super admin.
 *
 * @param appUserProfile - The user profile of the application.
 */
export const superAdminCheck = (
  appUserProfile: InterfaceAppUserProfile,
): void => {
  const userIsSuperAdmin: boolean = appUserProfile.isSuperAdmin;

  if (!userIsSuperAdmin) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE),
      USER_NOT_AUTHORIZED_SUPERADMIN.CODE,
      USER_NOT_AUTHORIZED_SUPERADMIN.PARAM,
    );
  }
};
