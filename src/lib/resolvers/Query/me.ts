import { QueryResolvers } from "../../../generated/graphqlCodegen";
import { User } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  IN_PRODUCTION,
} from "../../../constants";

/**
 * This query fetch the current user from the database.
 * @param _parent 
 * @param _args 
 * @param context - An object that contains `userId`.
 * @returns An object `currentUser` for the current user. If the user not found then it throws a `NotFoundError` error.
 */
export const me: QueryResolvers["me"] = async (_parent, _args, context) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  })
    .select(["-password"])
    .populate("createdOrganizations")
    .populate("createdEvents")
    .populate("joinedOrganizations")
    .populate("registeredEvents")
    .populate("eventAdmin")
    .populate("adminFor")
    .lean();

  if (!currentUser) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  return currentUser;
};
