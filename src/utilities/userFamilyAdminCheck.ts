import { Types } from "mongoose";
import { USER_NOT_AUTHORIZED_ADMIN } from "../constants";
import { errors, requestContext } from "../libraries";
import { AppUserProfile } from "../models";
import type { InterfaceUserFamily } from "../models/userFamily";
/**
 * If the current user is an admin of the organisation, this function returns `true` otherwise it returns `false`.
 * @remarks
 * This is a utility method.
 * @param userId - Current user id.
 * @param userFamily - userFamily data of `InterfaceuserFamily` type.
 * @returns `True` or `False`.
 */
export const adminCheck = async (
  userId: string | Types.ObjectId,
  userFamily: InterfaceUserFamily,
): Promise<void> => {
  const userIsUserFamilyAdmin = userFamily.admins.some(
    (admin) => admin === userId || new Types.ObjectId(admin).equals(userId),
  );

  // const user = await User.findOne({
  //   _id: userId,
  // });
  const appUserProfile = await AppUserProfile.findOne({
    userId: userId,
  });
  const isUserSuperAdmin: boolean = appUserProfile?.isSuperAdmin || false;

  if (!userIsUserFamilyAdmin && !isUserSuperAdmin) {
    throw new errors.UnauthorizedError(
      requestContext.translate(`${USER_NOT_AUTHORIZED_ADMIN.MESSAGE}`),
      USER_NOT_AUTHORIZED_ADMIN.CODE,
      USER_NOT_AUTHORIZED_ADMIN.PARAM,
    );
  }
};
