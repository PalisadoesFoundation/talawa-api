import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { User } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  USER_NOT_FOUND,
  IN_PRODUCTION,
} from "../../../constants";

export const logout: MutationResolvers["logout"] = async (
  _parent,
  _args,
  context
) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  // Checks whether currentUser with _id == context.userId exists.
  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  // Sets token field of currentUser with _id === context.userId to null.
  await User.updateOne(
    {
      _id: context.userId,
    },
    {
      $set: {
        token: null,
      },
    }
  );

  // Returns true if the operation is successful.
  return true;
};
