import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { User } from "../../models";
import {
  IN_PRODUCTION,
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
} from "../../../constants";
import { errors, requestContext } from "../../libraries";
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
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  // Checks whether currentUser is not a SUPERADMIN.
  if (currentUser.userType !== "SUPERADMIN") {
    throw new Error(USER_NOT_AUTHORIZED);
  }

  const userExists = await User.exists({
    _id: args.id,
  });

  // Checks whether user with _id === args.id exists.
  if (userExists === false) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  // Deletes the user.
  await User.deleteOne({
    _id: args.id,
  });

  // Returns true if operation is successful.
  return true;
};
