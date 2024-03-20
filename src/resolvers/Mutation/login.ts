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
} from "../../constants";
import { decryptEmail } from "../../utilities/encryptionModule";
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
  const allUsers = await User.find({});
  let isPasswordValid = false;
  // Checks whether user exists.
  let foundUser, email;
  for (const user of allUsers) {
    try {
      // Decrypting the email for each user
      const { decrypted } = decryptEmail(user.email);

      if (decrypted === args.data.email) {
        foundUser = user;
        email = args.data.email;
        isPasswordValid = await bcrypt.compare(
          args.data.password,
          user.password,
        );
      }
    } catch (error) {
      // Handling decryption errors (e.g., incorrect encryption key)
      console.error("Error decrypting email:", error);
    }
  }
  if (!foundUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  isPasswordValid = await bcrypt.compare(
    args.data.password,
    foundUser.password,
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
      requestContext.translate(INVALID_CREDENTIALS_ERROR.MESSAGE),
    );
  }

  const accessToken = await createAccessToken(foundUser);
  const refreshToken = await createRefreshToken(foundUser);
  copyToClipboard(`{
    "Authorization": "Bearer ${accessToken}"
  }`);

  // Updates the user to SUPERADMIN if the email of the user matches the LAST_RESORT_SUPERADMIN_EMAIL
  if (
    email.toLowerCase() === LAST_RESORT_SUPERADMIN_EMAIL?.toLowerCase() &&
    foundUser?.userType !== "SUPERADMIN"
  ) {
    await User.updateOne(
      {
        _id: foundUser?._id,
      },
      {
        userType: "SUPERADMIN",
      },
    );
  }

  await User.findOneAndUpdate(
    { _id: foundUser._id },
    { token: refreshToken, $inc: { tokenVersion: 1 } },
  );

  // Assigns new value with populated fields to user object.
  foundUser = await User.findOne({
    _id: foundUser._id,
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
    .lean();
  if (!foundUser) {
    throw new Error("User not found");
  }
  foundUser.email = decryptEmail(foundUser?.email).decrypted;
  return {
    user: foundUser ?? ({} as InterfaceUser),
    accessToken,
    refreshToken,
  };
};
