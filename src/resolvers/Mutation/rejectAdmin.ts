import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";
import { TRANSACTION_LOG_TYPES, USER_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";
import { superAdminCheck } from "../../utilities";
import { storeTransaction } from "../../utilities/storeTransaction";
/**
 * This function enables to reject an admin.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the user is the SUPERADMIN of the organization.
 * 3. If the user to be removed exists.
 * @returns True if the operation is successful.
 */
export const rejectAdmin: MutationResolvers["rejectAdmin"] = async (
  _parent,
  args,
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  }).lean();

  // Checks whether currentUser exists.
  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  // Checks whether currentUser is not a SUPERADMIN.
  superAdminCheck(currentUser);

  const userExists = await User.exists({
    _id: args.id,
  });

  // Checks whether user with _id === args.id exists.
  if (userExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  // Rejects the user as admin.
  await User.updateOne(
    {
      _id: args.id,
    },
    {
      $set: {
        adminApproved: false,
      },
    }
  );
  storeTransaction(
    context.userId,
    TRANSACTION_LOG_TYPES.UPDATE,
    "User",
    `User:${args.id} updated adminApproved`
  );

  // Returns true if operation is successful.
  return true;
};
