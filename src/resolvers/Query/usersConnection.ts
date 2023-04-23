import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { InterfaceUser, User } from "../../models";
import { getSort } from "./helperFunctions/getSort";
import { getWhere } from "./helperFunctions/getWhere";

/**
 * This query will fetch all the users in a specified order to paginate from the database.
 * @param _parent-
 * @param args - An object that contains relevant data to execute the query.
 * @returns An object that contains list of the users.
 * @remarks Connection in graphQL means pagination,
 * learn more about Connection {@link https://relay.dev/graphql/connections.htm | here}.
 */
export const usersConnection: QueryResolvers["usersConnection"] = async (
  _parent,
  args
) => {
  const where = getWhere<InterfaceUser>(args.where);
  const sort = getSort(args.orderBy);

  const users = await User.find(where)
    .sort(sort)
    .limit(args.first ?? 0)
    .skip(args.skip ?? 0)
    .select(["-password"])
    .populate("createdOrganizations")
    .populate("createdEvents")
    .populate("joinedOrganizations")
    .populate("registeredEvents")
    .populate("eventAdmin")
    .populate("adminFor")
    .lean();

  return users;
};
