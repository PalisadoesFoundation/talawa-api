import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";
import { errors } from "../../libraries";
import { USER_NOT_FOUND_ERROR } from "../../constants";
/**
 * This query fetch the current user from the database.
 * @param _parent -
 * @param _args -
 * @param context - An object that contains `userId`.
 * @returns An object `currentUser` for the current user. If the user not found then it throws a `NotFoundError` error.
 */
// Resolver function for field 'me' of type 'Query'
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
      USER_NOT_FOUND_ERROR.DESC,
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  return currentUser;
};
