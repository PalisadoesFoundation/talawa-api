import bcrypt from "bcryptjs";
import {
  INVALID_CREDENTIALS_ERROR,
  LAST_RESORT_SUPERADMIN_EMAIL,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type {
  InterfaceEvent,
  InterfaceOrganization,
  InterfaceUser,
} from "../../models";
import { AppUserProfile, User } from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import {
  copyToClipboard,
  createAccessToken,
  createRefreshToken,
} from "../../utilities";
/**
 * This function enables login.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the password is valid
 * @returns Updated user
 */
export const login: MutationResolvers["login"] = async (_parent, args) => {
  let user = await User.findOne({
    email: args.data.email.toLowerCase(),
  }).lean();

  // Checks whether user exists.
  if (!user) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }
  const isPasswordValid = await bcrypt.compare(
    args.data.password,
    user.password as string
  );
  // Checks whether password is invalid.
  if (isPasswordValid === false) {
    throw new errors.ValidationError(
      [
        {
          message: INVALID_CREDENTIALS_ERROR.MESSAGE,
          code: INVALID_CREDENTIALS_ERROR.CODE,
          param: INVALID_CREDENTIALS_ERROR.PARAM,
        },
      ],
      requestContext.translate(INVALID_CREDENTIALS_ERROR.MESSAGE)
    );
  }
  let appUserProfile = await AppUserProfile.findOne({
    userId: user._id.toString(),
  }).lean();
  if (!appUserProfile) {
    appUserProfile = await AppUserProfile.create({
      userId: user._id.toString(),
      appLanguageCode: "en",
      tokenVersion: 0,
      isSuperAdmin: false,
    });
    await User.updateOne(
      {
        _id: user._id.toString(),
      },
      {
        appUserProfileId: appUserProfile._id.toString(),
      }
    );
  }

  const accessToken = createAccessToken(user, appUserProfile);
  const refreshToken = createRefreshToken(user, appUserProfile);
  copyToClipboard(`{
    "Authorization": "Bearer ${accessToken}"
  }`);

  // Updates the user to SUPERADMIN if the email of the user matches the LAST_RESORT_SUPERADMIN_EMAIL
  if (
    user?.email.toLowerCase() === LAST_RESORT_SUPERADMIN_EMAIL?.toLowerCase() &&
    !appUserProfile.isSuperAdmin
  ) {
    // await User.updateOne(
    //   {
    //     _id: user?._id,
    //   },
    //   {
    //     userType: "SUPERADMIN",
    //   }
    // );
    await AppUserProfile.findOneAndUpdate(
      {
        user: user._id,
      },
      {
        isSuperAdmin: true,
      }
    );
  }

  // await User.findOneAndUpdate(
  //   { _id: user._id },
  //   { token: refreshToken, $inc: { tokenVersion: 1 } }
  // );
  await AppUserProfile.findOneAndUpdate(
    {
      user: user._id,
    },
    {
      token: refreshToken,
      $inc: {
        tokenVersion: 1,
      },
    }
  );
  // Assigns new value with populated fields to user object.
  user = await User.findOne({
    _id: user._id.toString(),
  })
    .select(["-password"])
    .populate("joinedOrganizations")
    // .populate("createdOrganizations")
    // .populate("createdEvents")
    .populate("registeredEvents")
    // .populate("eventAdmin")
    // .populate("adminFor")
    .populate("membershipRequests")
    .populate("organizationsBlockedBy")
    .lean();

  return {
    user: user as InterfaceUser,
    appUserProfile: {
      _id: appUserProfile._id.toString(),
      userId: appUserProfile.userId as InterfaceUser,
      adminFor: appUserProfile.adminFor as InterfaceOrganization[],
      appLanguageCode: appUserProfile.appLanguageCode,
      isSuperAdmin: appUserProfile.isSuperAdmin,
      pluginCreationAllowed: appUserProfile.pluginCreationAllowed,
      tokenVersion: appUserProfile.tokenVersion,
      eventAdmin: appUserProfile.eventAdmin as InterfaceEvent[],
      createdEvents: appUserProfile.createdEvents as InterfaceEvent[],
      createdOrganizations:
        appUserProfile.createdOrganizations as InterfaceOrganization[],
    },
    accessToken,
    refreshToken,
  };
};
