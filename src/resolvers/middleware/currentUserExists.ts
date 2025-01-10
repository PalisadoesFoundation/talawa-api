/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { User } from "../../models";
import { USER_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";

/**
 * Middleware function to check if the current user exists in the database.
 *
 * This function is used to check if the user making a request to the server exists in the database.
 * If the user does not exist, the function throws an error.
 *
 * @param next - The next function to call in the resolver chain.
 * @returns The result of the next function in the resolver chain.
 *
 * @see User - The User model used to interact with the users collection in the database.
 * @see USER_NOT_FOUND_ERROR - The error message to display when the user is not found.
 * @see errors - The library used to create custom errors in the application.
 */
export const currentUserExists =
  () =>
  (next: (root: any, args: any, context: any, info: any) => any) =>
  async (root: any, args: any, context: { userId: any }, info: any) => {
    const currentUser = await User.exists({
      _id: context.userId,
    });

    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    return next(root, args, context, info);
  };
