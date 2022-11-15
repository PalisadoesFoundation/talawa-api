import {
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
} from "../../../constants";
import { QueryResolvers } from "../../../generated/graphqlCodegen";
import { errors, requestContext } from "../../libraries";
import { User } from "../../models";

/**
 * This query fetch the user from the database.
 * @param _parent 
 * @param args - An object that contains `id` for the user.
 * @param context
 * @returns An object that contains user data. If the user is not found then it throws a `NotFoundError` error.
 */
export const user: QueryResolvers["user"] = async (_parent, args, context) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  const user = await User.findOne({
    _id: args.id,
  })
    .populate("adminFor")
    .lean();

  // This Query field doesn't allow client to see organizations they are blocked by
  return {
    ...user!,
    organizationsBlockedBy: [],
  };
};
