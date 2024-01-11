import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { TRANSACTION_LOG_TYPES, USER_NOT_FOUND_ERROR } from "../../constants";
import { User } from "../../models";
import { errors, requestContext } from "../../libraries";
import { superAdminCheck } from "../../utilities/superAdminCheck";
import { storeTransaction } from "../../utilities/storeTransaction";
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
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  superAdminCheck(currentUser);

  const userExists = await User.exists({
    _id: args.id,
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
      _id: args.id,
    },
    {
      $set: {
        adminApproved: true,
      },
    }
  );

  await storeTransaction(
    context.userId,
    TRANSACTION_LOG_TYPES.UPDATE,
    "User",
    `User:${args.id} accepted as admin`
  );
  return true;
};
