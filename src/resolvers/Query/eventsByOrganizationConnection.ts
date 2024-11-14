import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceEvent } from "../../models";
import { Event } from "../../models";
import { getSort } from "./helperFunctions/getSort";
import { getWhere } from "./helperFunctions/getWhere";
import { createRecurringEventInstancesDuringQuery } from "../../helpers/event/createEventHelpers";

/**
 * Retrieves events for a specific organization based on the provided query parameters.
 *
 * This function performs the following steps:
 * 1. Generates recurring event instances up to a certain date if the organization has any.
 * 2. Builds a query filter (`where`) and sorting parameters based on the provided arguments.
 * 3. Queries the database for events matching the filter, with sorting, pagination, and related data fetching.
 *
 * @param _parent - This parameter is not used in this resolver function.
 * @param args - The arguments provided by the GraphQL query, including filters (`where`), sorting order (`orderBy`), pagination options (`first` and `skip`), and any other query parameters.
 *
 * @returns A list of events matching the query parameters, with related data populated.
 */

export const eventsByOrganizationConnection: QueryResolvers["eventsByOrganizationConnection"] =
  async (_parent, args) => {
    // dynamically generate recurring event instances upto a certain date during this query
    await createRecurringEventInstancesDuringQuery(args.where?.organization_id);

    // get the where and sort
    let where = getWhere<InterfaceEvent>(args.where);
    const sort = getSort(args.orderBy);
    const currentDate = new Date();
    where = {
      ...where,
      isBaseRecurringEvent: false,
      ...(args.upcomingOnly && {
        $or: [
          { endDate: { $gt: currentDate } }, // Future dates
          {
            endDate: { $eq: currentDate.toISOString().split("T")[0] }, // Events today
            endTime: { $gt: currentDate }, // But start time is after current time
          },
        ],
      }),
    };

    // find all the events according to the requirements
    const events = await Event.find(where)
      .sort(sort)
      .limit(args.first ?? 0)
      .skip(args.skip ?? 0)
      .populate("creatorId", "-password")
      .populate("admins", "-password")
      .populate("volunteerGroups")
      .populate({
        path: "volunteers",
        populate: {
          path: "user",
        },
      })
      .lean();

    return events;
  };
