import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { AppUserProfile, User } from "../../models";
import {
  USER_NOT_FOUND_ERROR,
  SUPERADMIN_CANT_CHANGE_OWN_ROLE,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { superAdminCheck } from "../../utilities";
/**
 * This function enables to update user type.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * @returns Updated user type.
 */
export const updateUserType: MutationResolvers["updateUserType"] = async (
  _parent,
  args,
  context,
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  })
    .select(["userType"])
    .lean();

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

  superAdminCheck(currentUserAppProfile);
  if (args.data.id === currentUser._id.toString()) {
    throw new errors.InputValidationError(
      requestContext.translate(SUPERADMIN_CANT_CHANGE_OWN_ROLE.MESSAGE),
      SUPERADMIN_CANT_CHANGE_OWN_ROLE.CODE,
      SUPERADMIN_CANT_CHANGE_OWN_ROLE.PARAM,
    );
  }

  const userExists = await User.exists({
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    _id: args.data.id!,
  });

  if (userExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  await User.updateOne(
    {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      _id: args.data.id!,
    },
    {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      userType: args.data.userType!,
      adminApproved: true,
    },
  );

  return true;
};
