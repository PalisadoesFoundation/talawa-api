import { USER_NOT_FOUND_ERROR } from "../../constants";
import { errors } from "../../libraries";
import type {
  InterfaceEvent,
  InterfaceOrganization,
  InterfaceUser,
} from "../../models";
import { AppUserProfile, User } from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
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
      USER_NOT_FOUND_ERROR.DESC,
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }
  return {
    user: currentUser,
    appUserProfile: {
      // ...userAppProfile,
      _id: userAppProfile._id.toString(),
      userId: userAppProfile.userId as InterfaceUser,
      adminFor: userAppProfile.adminFor as InterfaceOrganization[],
      appLanguageCode: userAppProfile.appLanguageCode,
      isSuperAdmin: userAppProfile.isSuperAdmin,
      pluginCreationAllowed: userAppProfile.pluginCreationAllowed,
      tokenVersion: userAppProfile.tokenVersion,
      eventAdmin: userAppProfile.eventAdmin as InterfaceEvent[],
      createdEvents: userAppProfile.createdEvents as InterfaceEvent[],
      createdOrganizations:
        userAppProfile.createdOrganizations as InterfaceOrganization[],
    },
  };
};
