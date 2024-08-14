import bcrypt from "bcryptjs";
import {
  INVALID_CREDENTIALS_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceAppUserProfile, InterfaceUser } from "../../models";
import { AppUserProfile, User } from "../../models";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { deleteAppUserFromCache } from "../../services/AppUserProfileCache/deleteAppUserFromCache";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { deleteUserFromCache } from "../../services/UserCache/deleteUserFromCache";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Updates the password for the currently authenticated user.
 *
 * This function allows the current user to update their password. It performs the following steps:
 * 1. Retrieves the current user from the cache or database.
 * 2. Verifies the current user exists.
 * 3. Retrieves the current user's profile from the cache or database.
 * 4. Checks if the current user is authorized to update the password.
 * 5. Validates the previous password provided by the user.
 * 6. Ensures the new password and confirmation match.
 * 7. Hashes the new password and updates it in the database.
 * 8. Clears the user's token and updates their profile.
 * 9. Updates the user and profile caches.
 *
 * @param _parent - This parameter is not used in this resolver function.
 * @param args - The arguments provided by the GraphQL query, including the previous password, new password, and password confirmation.
 * @param context - The context of the request, containing information about the currently authenticated user.
 *
 * @returns An object containing the updated user and their profile.
 */

export const updateUserPassword: MutationResolvers["updateUserPassword"] =
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
        userId: currentUser._id,
      }).lean();
      if (currentUserAppProfile !== null) {
        await cacheAppUserProfile([currentUserAppProfile]);
      }
    }
    if (!currentUserAppProfile) {
      throw new errors.UnauthorizedError(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }
    const isPasswordValid = await bcrypt.compare(
      args.data.previousPassword,
      currentUser?.password || "",
    );

    // Checks whether password is invalid.
    if (isPasswordValid === false) {
      throw new errors.ValidationError(
        [
          {
            message: requestContext.translate(
              INVALID_CREDENTIALS_ERROR.MESSAGE,
            ),
            code: INVALID_CREDENTIALS_ERROR.CODE,
            param: INVALID_CREDENTIALS_ERROR.PARAM,
          },
        ],
        requestContext.translate(INVALID_CREDENTIALS_ERROR.MESSAGE),
      );
    }

    if (args.data.newPassword !== args.data.confirmNewPassword) {
      throw new errors.ValidationError(
        [
          {
            message: requestContext.translate(
              INVALID_CREDENTIALS_ERROR.MESSAGE,
            ),
            code: INVALID_CREDENTIALS_ERROR.CODE,
            param: INVALID_CREDENTIALS_ERROR.PARAM,
          },
        ],
        requestContext.translate(INVALID_CREDENTIALS_ERROR.MESSAGE),
      );
    }

    const hashedPassword = await bcrypt.hash(args.data.newPassword, 12);
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: context.userId,
      },
      {
        $set: {
          password: hashedPassword,
        },
      },
      {
        new: true,
      },
    );
    const updatedAppUserProfile: InterfaceAppUserProfile =
      (await AppUserProfile.findOneAndUpdate(
        {
          userId: context.userId,
        },
        {
          $set: {
            token: null,
          },
        },
        {
          new: true,
        },
      )
        .populate("createdOrganizations")
        .populate("createdEvents")
        .populate("eventAdmin")
        .populate("adminFor")
        .lean()) as InterfaceAppUserProfile;
    if (updatedUser) {
      await deleteUserFromCache(updatedUser._id.toString());
      await cacheUsers([updatedUser]);
    }
    if (updatedAppUserProfile) {
      await deleteAppUserFromCache(updatedAppUserProfile._id.toString());
      await cacheAppUserProfile([updatedAppUserProfile]);
    }
    return {
      user: updatedUser as InterfaceUser,
      appUserProfile: updatedAppUserProfile,
    };
  };
