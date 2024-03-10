import {
  LENGTH_VALIDATION_ERROR,
  USER_FAMILY_MIN_MEMBERS_ERROR_CODE,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";

import { errors, requestContext } from "../../libraries";
import { isValidString } from "../../libraries/validators/validateString";
import { AppUserProfile, User } from "../../models";
import { UserFamily } from "../../models/userFamily";
import type { InterfaceAppUserProfile } from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

import { superAdminCheck } from "../../utilities";
/**
 * This Function enables to create a user Family
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks - The following checks are done:
 * 1. If the user exists
 * 2. If the user is super admin
 * 3. If there are atleast two members in the family.
 * @returns Created user Family
 */
export const createUserFamily: MutationResolvers["createUserFamily"] = async (
  _parent,
  args,
  context,
) => {
  const currentUser = await User.findById({
    _id: context.userId,
  });

  // Checks whether user with _id === args.userId exists.
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
    throw new errors.UnauthenticatedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }
  // Check whether the user is super admin.
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
