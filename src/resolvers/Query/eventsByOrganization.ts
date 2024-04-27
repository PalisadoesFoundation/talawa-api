import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Event } from "../../models";
import { getSort } from "./helperFunctions/getSort";
/**
 * This query will fetch all the events for an organization from the database.
 * @param _parent-
 * @param args - An object that contains `orderBy` to sort the object as specified and `id` of the Organization.
 * @returns An `events` object that holds all the events for the Organization.
 */
export const eventsByOrganization: QueryResolvers["eventsByOrganization"] =
  async (_parent, args) => {
    const sort = getSort(args.orderBy);

    const events = await Event.find({
      organization: args.id,
    })
      .sort(sort)
      .populate("creatorId", "-password")
      .populate("admins", "-password")
      .lean();

    return events;
  };
