import {
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceAppUserProfile, InterfaceUser } from "../../models";
import { AppUserProfile, User } from "../../models";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { superAdminCheck } from "../../utilities";

/**
 * Allows a superadmin to enable or disable plugin creation for a specific user.
 *
 * This function performs several checks:
 *
 * 1. Verifies if the current user exists.
 * 2. Ensures that the current user has an associated app user profile.
 * 3. Confirms that the current user is a superadmin.
 * 4. Checks if the target user exists and updates their `pluginCreationAllowed` field based on the provided value.
 *
 * @param _parent - The parent object for the mutation (not used in this function).
 * @param args - The arguments provided with the request, including:
 *   - `userId`: The ID of the user whose plugin creation permissions are being modified.
 *   - `blockUser`: A boolean indicating whether to block (`true`) or allow (`false`) plugin creation for the user.
 * @param context - The context of the entire application, including user information and other context-specific data.
 *
 * @returns A promise that resolves to the updated user app profile object with the new `pluginCreationAllowed` value.
 *
 */
export const blockPluginCreationBySuperadmin: MutationResolvers["blockPluginCreationBySuperadmin"] =
  async (_parent, args, context) => {
    let currentUser: InterfaceUser | null;
    const userFoundInCache = await findUserInCache([context.userId]);
    currentUser = userFoundInCache[0];
    if (currentUser === null) {
      currentUser = await User.findOne({
        _id: context.userId,
      }).lean();
      if (currentUser !== null) {
        await cacheUsers([currentUser]);
      }
    }

    // Checks whether currentUser exists.
    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }
    let currentUserAppProfile: InterfaceAppUserProfile | null;
    const appUserProfileFoundInCache = await findAppUserProfileCache([
      currentUser.appUserProfileId?.toString(),
    ]);
    currentUserAppProfile = appUserProfileFoundInCache[0];
    if (currentUserAppProfile === null) {
      currentUserAppProfile = await AppUserProfile.findOne({
        _id: currentUser.appUserProfileId,
      }).lean();
      if (currentUserAppProfile !== null) {
        await cacheAppUserProfile([currentUserAppProfile]);
      }
    }

    if (!currentUserAppProfile) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    // Checks whether currentUser is a SUPERADMIN.
    superAdminCheck(currentUserAppProfile as InterfaceAppUserProfile);

    const userAppProfile = await AppUserProfile.findOne({
      userId: args.userId,
    }).lean();
    if (!userAppProfile) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    /*
    Sets the pluginCreationAllowed field on the document of the appUserProfile with _id === args.userId
    to !args.blockUser and returns the updated user profile.
    */
    return (await AppUserProfile.findOneAndUpdate(
      {
        userId: args.userId,
      },
      {
        $set: {
          pluginCreationAllowed: !args.blockUser,
        },
      },
      {
        new: true,
      },
    ).lean()) as InterfaceAppUserProfile;
  };
