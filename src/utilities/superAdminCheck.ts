import { errors, requestContext } from "../libraries";
import { USER_NOT_AUTHORIZED_SUPERADMIN } from "../constants";
import { Interface_User } from "../models";

export const superAdminCheck = (user: Interface_User) => {
  const userIsSuperAdmin: boolean = user?.userType === "SUPERADMIN";

  if (!userIsSuperAdmin) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_SUPERADMIN.message),
      USER_NOT_AUTHORIZED_SUPERADMIN.code,
      USER_NOT_AUTHORIZED_SUPERADMIN.param
    );
  }
};
