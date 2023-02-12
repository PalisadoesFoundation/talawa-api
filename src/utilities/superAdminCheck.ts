import { errors, requestContext } from "../libraries";
import {
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_PARAM,
} from "../constants";
import { Interface_User } from "../models";

export const superAdminCheck = (user: Interface_User) => {
  const userIsOrganizationAdmin: boolean = user?.userType === "SUPERADMIN";

  if (userIsOrganizationAdmin === false) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
      USER_NOT_AUTHORIZED_CODE,
      USER_NOT_AUTHORIZED_PARAM
    );
  }
};
