import { Types } from "mongoose";
import { errors, requestContext } from "../libraries";
import { USER_NOT_AUTHORIZED_ADMIN } from "../constants";
import type { InterfaceUserFamily } from "../models/userFamily";
import { User } from "../models";
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
<<<<<<< HEAD
  userFamily: InterfaceUserFamily
): Promise<void> => {
  const userIsUserFamilyAdmin = userFamily.admins.some(
    (admin) => admin === userId || Types.ObjectId(admin).equals(userId)
=======
  userFamily: InterfaceUserFamily,
): Promise<void> => {
  const userIsUserFamilyAdmin = userFamily.admins.some(
    (admin) => admin === userId || Types.ObjectId(admin).equals(userId),
>>>>>>> 08a668823866ed5bfa7b412d358575e3a3889c71
  );

  const user = await User.findOne({
    _id: userId,
  });
  const isUserSuperAdmin: boolean = user
    ? user.userType === "SUPERADMIN"
    : false;

  if (!userIsUserFamilyAdmin && !isUserSuperAdmin) {
    throw new errors.UnauthorizedError(
      requestContext.translate(`${USER_NOT_AUTHORIZED_ADMIN.MESSAGE}`),
      USER_NOT_AUTHORIZED_ADMIN.CODE,
<<<<<<< HEAD
      USER_NOT_AUTHORIZED_ADMIN.PARAM
=======
      USER_NOT_AUTHORIZED_ADMIN.PARAM,
>>>>>>> 08a668823866ed5bfa7b412d358575e3a3889c71
    );
  }
};
