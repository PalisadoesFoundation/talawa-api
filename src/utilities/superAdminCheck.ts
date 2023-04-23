import { errors, requestContext } from "../libraries";
import { USER_NOT_AUTHORIZED_SUPERADMIN } from "../constants";
import { InterfaceUser } from "../models";

export const superAdminCheck = (user: InterfaceUser) => {
  const userIsSuperAdmin: boolean = user.userType === "SUPERADMIN";

  if (!userIsSuperAdmin) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE),
      USER_NOT_AUTHORIZED_SUPERADMIN.CODE,
      USER_NOT_AUTHORIZED_SUPERADMIN.PARAM
    );
  }
};
