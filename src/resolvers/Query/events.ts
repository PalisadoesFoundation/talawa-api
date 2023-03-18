import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Event } from "../../models";
import { getSort } from "./helperFunctions/getSort";
/**
 * This query will fetch all events with `ACTIVE` status and sorts them as specified from database.
 * @param _parent
 * @param args - An object that contains `orderBy` that helps to sort the object as specified.
 * @returns An `events` object that holds all events with `ACTIVE` status.
 * @remarks You can learn about GraphQL `Resolvers`
 * {@link https://www.apollographql.com/docs/apollo-server/data/resolvers/ | here}.
 */
export const events: QueryResolvers["events"] = async (_parent, args) => {
  const sort = getSort(args.orderBy);

  const events = await Event.find({
    status: "ACTIVE",
  })
    .sort(sort)
    .populate("creator", "-password")
    .populate("tasks")
    .populate("admins", "-password")
    .lean();

  return events;
};
