import type { InterfaceAppUserProfile } from "../../models";
import { User, AppUserProfile } from "../../models";
import {
  COMMUNITY_NOT_FOUND_ERROR,
  INVALID_TIMEOUT_RANGE,
  USER_NOT_FOUND_ERROR,
  APP_USER_PROFILE_NOT_FOUND_ERROR,
  MINIMUM_TIMEOUT_MINUTES,
  MAXIMUM_TIMEOUT_MINUTES,
} from "../../constants";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { superAdminCheck } from "../../utilities";
import { Community } from "../../models/Community";

/**
 * This function updates the session timeout and can only be performed by superadmin users.
 * @param _parent - parent of the current request
 * @param args - payload provided with the request, including organizationId and timeout
 * @param context - context of the entire application, containing user information
 * @returns - A message true if the organization timeout is updated successfully
 * @throws - NotFoundError: If the user, appuserprofile or organization is not found
 * @throws - ValidationError: If the user is not an admin or superadmin, or if the timeout is outside the valid range
 * @throws - InternalServerError: If there is an error updating the organization timeout
 *
 */

export const updateSessionTimeout: MutationResolvers["updateSessionTimeout"] =
  async (_parent, args, context) => {
    const userId = context.userId;
    const user = await User.findById(userId).lean();

    if (!user) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    //const appuserprofile: InterfaceAppUserProfile | null = await AppUserProfile.findOne({userId: userId}).lean();
    const appuserprofile: InterfaceAppUserProfile | null =
      await AppUserProfile.findById(user.appUserProfileId).lean(); //more appropriate since it shows the link between the user and the userprofile

    if (!appuserprofile) {
      throw new errors.NotFoundError(
        requestContext.translate(APP_USER_PROFILE_NOT_FOUND_ERROR.MESSAGE),
        APP_USER_PROFILE_NOT_FOUND_ERROR.CODE,
        APP_USER_PROFILE_NOT_FOUND_ERROR.PARAM,
      );
    }

    superAdminCheck(appuserprofile);

    const community = await Community.findOne().lean();

    if (!community) {
      throw new errors.NotFoundError(
        requestContext.translate(COMMUNITY_NOT_FOUND_ERROR.MESSAGE),
        COMMUNITY_NOT_FOUND_ERROR.CODE,
        COMMUNITY_NOT_FOUND_ERROR.PARAM,
      );
    }

    if (
      args.timeout < MINIMUM_TIMEOUT_MINUTES ||
      args.timeout > MAXIMUM_TIMEOUT_MINUTES ||
      args.timeout % 5 !== 0
    ) {
      throw new errors.ValidationError(
        [
          {
            message: requestContext.translate(INVALID_TIMEOUT_RANGE.MESSAGE),
            code: INVALID_TIMEOUT_RANGE.CODE,
            param: INVALID_TIMEOUT_RANGE.PARAM,
          },
        ],
        INVALID_TIMEOUT_RANGE.MESSAGE,
      );
    }

    await Community.findByIdAndUpdate(
      community._id,
      { timeout: args.timeout },
      { new: true },
    );

    return true;
  };
