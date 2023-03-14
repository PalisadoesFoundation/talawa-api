import { Types } from "mongoose";
import { errors, requestContext } from "../libraries";
import { USER_NOT_AUTHORIZED_ADMIN } from "../constants";
import { Interface_Organization, User } from "../models";

export const adminCheck = async (
  userId: string | Types.ObjectId,
  organization: Interface_Organization
) => {
  const userIsOrganizationAdmin = organization.admins.some((admin) =>
    admin.equals(userId)
  );

  const user = await User.findOne({
    _id: userId,
  });

  const isUserSuperAdmin: boolean = user!.userType === "SUPERADMIN";

  if (!userIsOrganizationAdmin && !isUserSuperAdmin) {
    throw new errors.UnauthorizedError(
      requestContext.translate(`${USER_NOT_AUTHORIZED_ADMIN.MESSAGE}`),
      USER_NOT_AUTHORIZED_ADMIN.CODE,
      USER_NOT_AUTHORIZED_ADMIN.PARAM
    );
  }
};
