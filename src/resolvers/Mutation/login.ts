import bcrypt from "bcryptjs";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceUser } from "../../models";
import { User } from "../../models";
import {
  createAccessToken,
  createRefreshToken,
  copyToClipboard,
} from "../../utilities";
import { errors, requestContext } from "../../libraries";
import {
  INVALID_CREDENTIALS_ERROR,
  USER_NOT_FOUND_ERROR,
  LAST_RESORT_SUPERADMIN_EMAIL,
  TRANSACTION_LOG_TYPES,
} from "../../constants";
import { storeTransaction } from "../../utilities/storeTransaction";
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
    user.password
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
  const accessToken = await createAccessToken(user);
  const refreshToken = await createRefreshToken(user);
  copyToClipboard(`{
    "Authorization": "Bearer ${accessToken}"
  }`);

  // Updates the user to SUPERADMIN if the email of the user matches the LAST_RESORT_SUPERADMIN_EMAIL
  if (
    user?.email.toLowerCase() === LAST_RESORT_SUPERADMIN_EMAIL?.toLowerCase() &&
    user?.userType !== "SUPERADMIN"
  ) {
    await User.updateOne(
      {
        _id: user?._id,
      },
      {
        userType: "SUPERADMIN",
      }
    );
  }

  await User.findOneAndUpdate(
    { _id: user._id },
    { token: refreshToken, $inc: { tokenVersion: 1 } }
  );
  await storeTransaction(
    user._id,
    TRANSACTION_LOG_TYPES.UPDATE,
    "User",
    `User:${user._id} updated token, tokenVersion`
  );

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
    user: user ?? ({} as InterfaceUser),
    accessToken,
    refreshToken,
  };
};
