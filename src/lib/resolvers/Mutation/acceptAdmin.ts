import { MutationResolvers } from "../../../generated/graphqlCodegen";
import {
  IN_PRODUCTION,
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
} from "../../../constants";
import { User } from "../../models";
import { errors, requestContext } from "../../libraries";
/**
 * This function accepts the admin request sent by a user.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks THe following checks are done:
 * 1. Whether the user exists
 * 2. Whether the user accepting the admin request is a superadmin or not.
 */
export const acceptAdmin: MutationResolvers["acceptAdmin"] = async (
  _parent,
  args,
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  }).lean();

  if (!currentUser) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  if (currentUser.userType !== "SUPERADMIN") {
    throw new Error(USER_NOT_AUTHORIZED);
  }

  const userExists = await User.exists({
    _id: args.id,
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
      _id: args.id,
    },
    {
      $set: {
        adminApproved: true,
      },
    }
  );

  return true;
};
