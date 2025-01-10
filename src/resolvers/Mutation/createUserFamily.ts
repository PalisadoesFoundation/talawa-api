import {
  LENGTH_VALIDATION_ERROR,
  USER_FAMILY_MIN_MEMBERS_ERROR_CODE,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";

import { errors, requestContext } from "../../libraries";
import { isValidString } from "../../libraries/validators/validateString";
import type { InterfaceAppUserProfile, InterfaceUser } from "../../models";
import { AppUserProfile, User } from "../../models";
import { UserFamily } from "../../models/userFamily";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import { superAdminCheck } from "../../utilities";

/**
 * Creates a new user family and associates users with it.
 *
 * This function performs the following actions:
 * 1. Verifies the existence of the current user and retrieves their details and application profile.
 * 2. Checks if the current user is a super admin.
 * 3. Validates the user family name to ensure it does not exceed 256 characters.
 * 4. Ensures that the user family has at least two members.
 * 5. Creates the user family and associates it with the provided users.
 *
 * @param _parent - The parent object for the mutation. This parameter is not used in this resolver.
 * @param args - The arguments for the mutation, including:
 *   - `data.title`: The title of the user family (must be a string with a maximum length of 256 characters).
 *   - `data.userIds`: An array of user IDs to be included in the user family (must contain at least 2 members).
 * @param context - The context for the mutation, including:
 *   - `userId`: The ID of the current user creating the user family.
 *
 * @returns The created user family object.
 *
 * @see User - The User model used to interact with user data in the database.
 * @see AppUserProfile - The AppUserProfile model used to interact with user profile data in the database.
 * @see UserFamily - The UserFamily model used to interact with user family data in the database.
 * @see superAdminCheck - A utility function to check if the user is a super admin.
 */
export const createUserFamily: MutationResolvers["createUserFamily"] = async (
  _parent,
  args,
  context,
) => {
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

  // Checks whether user with _id === context.userId exists.
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
    throw new errors.UnauthenticatedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  // Check whether the user is a super admin.
  superAdminCheck(currentUserAppProfile as InterfaceAppUserProfile);

  let validationResultName = {
    isLessThanMaxLength: false,
  };

  if (args && args.data && typeof args.data.title === "string") {
    validationResultName = isValidString(args.data.title, 256);
  }

  if (!validationResultName.isLessThanMaxLength) {
    throw new errors.InputValidationError(
      requestContext.translate(
        `${LENGTH_VALIDATION_ERROR.MESSAGE} 256 characters in name`,
      ),
      LENGTH_VALIDATION_ERROR.CODE,
    );
  }

  // Check if there are at least 2 members
  if (args.data?.userIds.length < 2) {
    throw new errors.InputValidationError(
      requestContext.translate(USER_FAMILY_MIN_MEMBERS_ERROR_CODE.MESSAGE),
      USER_FAMILY_MIN_MEMBERS_ERROR_CODE.CODE,
      USER_FAMILY_MIN_MEMBERS_ERROR_CODE.PARAM,
    );
  }

  const userfamilyTitle = args.data?.title;

  const createdUserFamily = await UserFamily.create({
    ...args.data,
    title: userfamilyTitle,
    users: [context.userId, ...args.data.userIds],
    admins: [context.userId],
    creator: context.userId,
  });

  return createdUserFamily.toObject();
};
