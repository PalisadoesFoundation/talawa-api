import { errors, requestContext } from "../libraries";
import { USER_NOT_AUTHORIZED_ADMIN } from "../constants";
import type { InterfaceUser } from "../models";

export const isAuthCheck = (user: InterfaceUser): void => {
  const userIsAuthorized: boolean =
    user.userType === "SUPERADMIN" || user.userType === "ADMIN";

  if (!userIsAuthorized) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ADMIN.MESSAGE),
      USER_NOT_AUTHORIZED_ADMIN.CODE,
      USER_NOT_AUTHORIZED_ADMIN.PARAM,
    );
  }
};
