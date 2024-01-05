import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";
import {
  USER_NOT_FOUND_ERROR,
  SUPERADMIN_CANT_CHANGE_OWN_ROLE,
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
export const updateAppUserType: MutationResolvers["updateAppUserType"] = async (
  _parent,
  args,
  context
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
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const userExists = await User.exists({
    _id: args.data.id!,
  });

  if (userExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  await User.updateOne(
    {
      _id: args.data.id!,
    },
    {
      appUserType: args.data.appUserType!,
      adminApproved: true,
    }
  );

  return true;
};
