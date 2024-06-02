/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { User } from "../../models";
import { USER_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";

// This is a middleware that checks that the user specificied by the `userId` parameter in the context does indeed exist in the database
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
