import {
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../constants";
import { errors } from "../../libraries";
import {
  AppUserProfile,
  InterfaceUser,
  User,
  type InterfaceAppUserProfile,
} from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { decryptEmail } from "../../utilities/encryption";
/**
 * This query fetch the current user from the database.
 * @param _parent-
 * @param _args-
 * @param context - An object that contains `userId`.
 * @returns An object `currentUser` for the current user. If the user not found then it throws a `NotFoundError` error.
 */
// Resolver function for field 'me' of type 'Query'
export const me: QueryResolvers["me"] = async (_parent, _args, context) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  })
    .select(["-password"])

    .populate("joinedOrganizations")
    .populate("registeredEvents")

    .lean();

  if (!currentUser) {
    throw new errors.NotFoundError(
      USER_NOT_FOUND_ERROR.DESC,
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }
  const userAppProfile = await AppUserProfile.findOne({
    userId: currentUser._id,
  })
    .populate("createdOrganizations")
    .populate("createdEvents")
    .populate("eventAdmin")
    .populate("adminFor")
    .lean();
  if (!userAppProfile) {
    throw new errors.NotFoundError(
      USER_NOT_AUTHORIZED_ERROR.DESC,
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  const { decrypted } = decryptEmail(currentUser.email);
  currentUser.email = decrypted;

  return {
    user: currentUser as InterfaceUser,
    appUserProfile: userAppProfile as InterfaceAppUserProfile,
  };
};