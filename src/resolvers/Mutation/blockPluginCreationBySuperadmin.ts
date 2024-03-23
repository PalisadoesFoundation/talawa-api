import {
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { AppUserProfile, User } from "../../models";
import type { InterfaceAppUserProfile } from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { superAdminCheck } from "../../utilities";
/**
 * This function enables an admin to create block plugin.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2.If the user has appUserProfile
 * 2. If the user is the SUPERADMIN of organization
 * @returns Deleted updated user
 */
export const blockPluginCreationBySuperadmin: MutationResolvers["blockPluginCreationBySuperadmin"] =
  async (_parent, args, context) => {
    const currentUser = await User.findOne({
      _id: context.userId,
    }).lean();

    // Checks whether currentUser exists.
    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }
    const currentUserAppProfile = await AppUserProfile.findOne({
      userId: currentUser._id,
    }).lean();

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
    Sets pluginCreationAllowed field on document of appUserProfile with _id === args.userId
    to !args.blockUser and returns the updated user.
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
