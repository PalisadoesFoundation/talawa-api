import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { User } from "../../models";
import {
  USER_NOT_AUTHORIZED,
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
} from "../../../constants";
import { errors, requestContext } from "../../libraries";
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
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  })
    .select(["userType"])
    .lean();

  if (currentUser!.userType !== "SUPERADMIN") {
    throw new Error(USER_NOT_AUTHORIZED);
  }

  const userExists = await User.exists({
    _id: args.data.id!,
  });

  if (userExists === false) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  await User.updateOne(
    {
      _id: args.data.id!,
    },
    {
      userType: args.data.userType!,
      adminApproved: true,
    }
  );

  return true;
};
