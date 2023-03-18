import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Interface_User, User } from "../../models";
import { errors, requestContext } from "../../libraries";
import { USER_NOT_FOUND_ERROR } from "../../constants";
import { getSort } from "./helperFunctions/getSort";
import { getInputArgs } from "./helperFunctions/getInputArgs";
import { FilterQuery } from "mongoose";

/**
 * This query will fetch all the users in specified order from the database.
 * @param _parent
 * @param args - An object that contains relevant data to perform the query.
 * @returns An object that contains the list of all the users.
 * @remarks The query function uses `getSort()` function to sort the data in specified.
 */
export const users: QueryResolvers["users"] = async (_parent, args) => {
  const inputArg: FilterQuery<Interface_User> = getInputArgs(args.where);
  const sort = getSort(args.orderBy);

  const users = await User.find(inputArg)
    .sort(sort)
    .select(["-password"])
    .populate("createdOrganizations")
    .populate("createdEvents")
    .populate("joinedOrganizations")
    .populate("registeredEvents")
    .populate("eventAdmin")
    .populate("adminFor")
    .lean();

  if (!users[0]) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  } else
    return users.map((user) => {
      return {
        ...user,
        organizationsBlockedBy: [],
      };
    });
};
