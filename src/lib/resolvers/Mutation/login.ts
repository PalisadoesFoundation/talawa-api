import bcrypt from "bcryptjs";
import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { User } from "../../models";
import {
  createAccessToken,
  createRefreshToken,
  copyToClipboard,
} from "../../utilities";
import { errors, requestContext } from "../../libraries";
import { androidFirebaseOptions, iosFirebaseOptions } from "../../config";
import {
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
} from "../../../constants";
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
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  const isPasswordValid = await bcrypt.compare(
    args.data.password,
    user.password
  );

  // Checks whether password is invalid.
  if (isPasswordValid === false) {
    throw new errors.ValidationError(
      [
        {
          message:
            IN_PRODUCTION !== true
              ? "Invalid credentials"
              : requestContext.translate("invalid.credentials"),
          code: "invalid.credentials",
          param: "credentials",
        },
      ],
      IN_PRODUCTION !== true
        ? "Invalid credentials"
        : requestContext.translate("invalid.credentials")
    );
  }

  const accessToken = await createAccessToken(user);
  const refreshToken = await createRefreshToken(user);

  copyToClipboard(`{
    "Authorization": "Bearer ${accessToken}"
  }`);

  // Assigns new value with populated fields to user object.
  user = await User.findOne({
    _id: user._id,
  })
    .select(["-password"])
    .populate("joinedOrganizations")
    .populate("createdOrganizations")
    .populate("createdEvents")
    .populate("registeredEvents")
    .populate("eventAdmin")
    .populate("adminFor")
    .populate("membershipRequests")
    .populate("organizationsBlockedBy")
    .populate("organizationUserBelongsTo")
    .lean();

  return {
    user: user!,
    accessToken,
    refreshToken,
    androidFirebaseOptions,
    iosFirebaseOptions,
  };
};
