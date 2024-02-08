import { USER_NOT_FOUND_ERROR } from "../../constants";
import { errors } from "../../libraries";
import type {
  InterfaceAppUserProfile,
  InterfaceEvent,
  InterfaceOrganization,
  InterfaceUser,
} from "../../models";
import { AppUserProfile, User } from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
/**
 * This query fetch the user from the database.
 * @param _parent-
 * @param args - An object that contains `id` for the user.
 * @param context-
 * @returns An object that contains user data. If the user is not found then it throws a `NotFoundError` error.
 */
export const user: QueryResolvers["user"] = async (_parent, args, context) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      USER_NOT_FOUND_ERROR.DESC,
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const user: InterfaceUser = await User.findOne({
    _id: args.id,
  }).lean();
  const userAppProfile: InterfaceAppUserProfile = await AppUserProfile.findOne({
    userId: user._id,
  })
    .populate("adminFor")
    .lean();

  // This Query field doesn't allow client to see organizations they are blocked by
  return {
    user: {
      ...user,
      image: user?.image ? `${context.apiRootUrl}${user.image}` : null,
      organizationsBlockedBy: [],
    },
    appUserProfile: {
      // ...userAppProfile,
      _id: userAppProfile._id.toString(),
      user: userAppProfile.userId as InterfaceUser,
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
