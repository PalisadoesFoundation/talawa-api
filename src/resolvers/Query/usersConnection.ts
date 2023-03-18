import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Interface_User, User } from "../../models";
import { getSort } from "./helperFunctions/getSort";
import { getInputArgs } from "./helperFunctions/getInputArgs";
import { FilterQuery } from "mongoose";

export const usersConnection: QueryResolvers["usersConnection"] = async (
  _parent,
  args
) => {
  const inputArg: FilterQuery<Interface_User> = getInputArgs(args.where);
  const sort = getSort(args.orderBy);

  const users = await User.find(inputArg)
    .sort(sort)
    .limit(args.first!)
    .skip(args.skip!)
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
