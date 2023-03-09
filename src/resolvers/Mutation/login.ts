import bcrypt from "bcryptjs";
import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";
import {
  createAccessToken,
  createRefreshToken,
  copyToClipboard,
} from "../../utilities";
import { errors, requestContext } from "../../libraries";
import { androidFirebaseOptions, iosFirebaseOptions } from "../../config";
import {
  INVALID_CREDENTIALS_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";

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
    user.password
  );
  // Checks whether password is invalid.
  if (isPasswordValid === false) {
    throw new errors.ValidationError(
      [
        {
          message: requestContext.translate(INVALID_CREDENTIALS_ERROR.MESSAGE),
          code: INVALID_CREDENTIALS_ERROR.CODE,
          param: INVALID_CREDENTIALS_ERROR.PARAM,
        },
      ],
      requestContext.translate(INVALID_CREDENTIALS_ERROR.MESSAGE)
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
