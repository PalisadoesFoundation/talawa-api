import { Types } from "mongoose";
import { USER_NOT_AUTHORIZED_ADMIN } from "../constants";
import { errors, requestContext } from "../libraries";
import type { InterfaceOrganization } from "../models";
import { AppUserProfile } from "../models";
/**
 * If the current user is an admin of the organisation, this function returns `true` otherwise it returns `false`.
 * @remarks
 * This is a utility method.
 * @param userId - Current user id.
 * @param organization - Organization data of `InterfaceOrganization` type.
 * @returns `True` or `False`.
 */
export const adminCheck = async (
  userId: string | Types.ObjectId,
  organization: InterfaceOrganization,
): Promise<void> => {
  const userIsOrganizationAdmin = organization.admins.some(
    (admin) => admin === userId || new Types.ObjectId(admin).equals(userId),
  );

  const userAppProfile = await AppUserProfile.findOne({
    userId,
  }).lean();
  if (!userAppProfile) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ADMIN.MESSAGE),
      USER_NOT_AUTHORIZED_ADMIN.CODE,
      USER_NOT_AUTHORIZED_ADMIN.PARAM,
    );
  }
  const isUserSuperAdmin: boolean = userAppProfile.isSuperAdmin;

  if (!userIsOrganizationAdmin && !isUserSuperAdmin) {
    throw new errors.UnauthorizedError(
      requestContext.translate(`${USER_NOT_AUTHORIZED_ADMIN.MESSAGE}`),
      USER_NOT_AUTHORIZED_ADMIN.CODE,
      USER_NOT_AUTHORIZED_ADMIN.PARAM,
    );
  }
};
