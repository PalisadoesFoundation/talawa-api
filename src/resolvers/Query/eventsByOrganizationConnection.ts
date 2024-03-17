import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceEvent } from "../../models";
import { Event } from "../../models";
import { getSort } from "./helperFunctions/getSort";
import { getWhere } from "./helperFunctions/getWhere";
import { createRecurringEventInstancesDuringQuery } from "../../helpers/event/createEventHelpers";

export const eventsByOrganizationConnection: QueryResolvers["eventsByOrganizationConnection"] =
  async (_parent, args) => {
    // dynamically generate recurring event instances upto a certain date during this query
    await createRecurringEventInstancesDuringQuery(args.where?.organization_id);

    // get the where and sort
    let where = getWhere<InterfaceEvent>(args.where);
    const sort = getSort(args.orderBy);

    where = {
      ...where,
      status: "ACTIVE",
      isBaseRecurringEvent: false,
    };

    // find all the events according to the requirements
    const events = await Event.find(where)
      .sort(sort)
      .limit(args.first ?? 0)
      .skip(args.skip ?? 0)
      .populate("creatorId", "-password")
      .populate("admins", "-password")
      .lean();

    return events;
  };
