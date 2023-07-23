import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { USER_NOT_FOUND_ERROR } from "../../constants";
import { User } from "../../models";
import { superAdminCheck } from "../../utilities/superAdminCheck";
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
    return {
      data: false,
      errors: [
        {
          __typename: "UnauthenticatedError",
          message: USER_NOT_FOUND_ERROR.MESSAGE,
          path: [USER_NOT_FOUND_ERROR.PARAM],
        },
      ],
    };
  }

  superAdminCheck(currentUser);

  const userExists = await User.exists({
    _id: args.input.userId,
  });

  if (userExists === false) {
    return {
      data: false,
      errors: [
        {
          __typename: "UserNotFoundError",
          message: USER_NOT_FOUND_ERROR.MESSAGE,
          path: [USER_NOT_FOUND_ERROR.PARAM],
        },
      ],
    };
  }

  await User.updateOne(
    {
      _id: args.input.userId,
    },
    {
      $set: {
        adminApproved: true,
      },
    }
  );

  return {
    data: true,
    errors: [],
  };
};
