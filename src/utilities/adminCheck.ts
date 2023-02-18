import { Types } from "mongoose";
import { errors, requestContext } from "../libraries";
import { USER_NOT_AUTHORIZED_ADMIN } from "../constants";
import { Interface_Organization } from "../models";

export const adminCheck = (
  userId: string | Types.ObjectId,
  organization: Interface_Organization
) => {
  const userIsOrganizationAdmin = organization.admins.some((admin) =>
    admin.equals(userId)
  );

  if (userIsOrganizationAdmin === false) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ADMIN.message),
      USER_NOT_AUTHORIZED_ADMIN.code,
      USER_NOT_AUTHORIZED_ADMIN.param
    );
  }
};
