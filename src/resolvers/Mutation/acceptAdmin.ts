import {
  USER_NOT_AUTHORIZED_SUPERADMIN,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { AppUserProfile, User } from "../../models";
import type { InterfaceAppUserProfile } from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { superAdminCheck } from "../../utilities/superAdminCheck";
/**
 * This function accepts the admin request sent by a user.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. Whether the user exists
 * 2. Whether the user has appProfile or not (if not, then the user is not a superadmin).
 * 3. Whether the user accepting the admin request is a superadmin or not.
 */
export const acceptAdmin: MutationResolvers["acceptAdmin"] = async (
  _parent,
  args,
  context,
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  }).lean();

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

  //if user does not have appProfile then he is NON_USER
  if (!currentUserAppProfile) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE),
      USER_NOT_AUTHORIZED_SUPERADMIN.CODE,
      USER_NOT_AUTHORIZED_SUPERADMIN.PARAM,
    );
  }

  superAdminCheck(currentUserAppProfile as InterfaceAppUserProfile);

  const userExists = !!(await User.exists({
    _id: args.id,
  }));

  if (userExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  await AppUserProfile.updateOne(
    {
      userId: args.id,
    },
    {
      $set: {
        adminApproved: true,
      },
    },
  );

  return true;
};
