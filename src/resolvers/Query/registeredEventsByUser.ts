import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Event } from "../../models";
import { getSort } from "./helperFunctions/getSort";

/**
 * This query will fetch all the events for which user registered from the database.
 * @param _parent-
 * @param args - An object that contains `id` of the user and `orderBy`.
 * @returns An object that contains the Event data.
 * @remarks The query function uses `getSort()` function to sort the data in specified.
 */
export const registeredEventsByUser: QueryResolvers["registeredEventsByUser"] =
  async (_parent, args) => {
    const sort = getSort(args.orderBy);

    return await Event.find({
      status: "ACTIVE",
      registrants: {
        $elemMatch: {
          userId: args.id,
          status: "ACTIVE",
        },
      },
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();
  };
