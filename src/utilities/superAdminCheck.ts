import { USER_NOT_AUTHORIZED_SUPERADMIN } from "../constants";
import { errors, requestContext } from "../libraries";
import type { InterfaceAppUserProfile } from "../models";

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
