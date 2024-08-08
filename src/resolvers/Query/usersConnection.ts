import type { InterfaceAppUserProfile, InterfaceUser } from "../../models";
import { AppUserProfile, User } from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
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
  args,
) => {
  const where = getWhere<InterfaceUser>(args.where);
  const sort = getSort(args.orderBy);

  const users = await User.find(where)
    .sort(sort)
    .limit(args.first ?? 0)
    .skip(args.skip ?? 0)
    .select(["-password"])
    .populate("joinedOrganizations")
    .populate("registeredEvents")
    .lean();
  return await Promise.all(
    users.map(async (user) => {
      const userAppProfile = await AppUserProfile.findOne({
        userId: user._id,
      })
        .populate("createdOrganizations")
        .populate("createdEvents")
        .populate("eventAdmin")
        .populate("adminFor")
        .populate("pledges")
        .populate("campaigns")
        .lean();
      return {
        user: user as InterfaceUser,
        appUserProfile: userAppProfile as InterfaceAppUserProfile,
      };
    }),
  );
};
