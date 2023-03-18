import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Event, Interface_UserAttende } from "../../models";
import { STATUS_ACTIVE } from "../../constants";
import { getSort } from "./helperFunctions/getSort";
/**
 * This query will fetch all events for the organization which have `ACTIVE` status from database.
 * @param _parent
 * @param args - An object that contains `orderBy` to sort the object as specified and `id` of the Organization.
 * @returns An `events` object that holds all events with `ACTIVE` status for the Organization.
 */
export const eventsByOrganization: QueryResolvers["eventsByOrganization"] =
  async (_parent, args) => {
    const sort = getSort(args.orderBy);

    const events = await Event.find({
      organization: args.id,
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    events.forEach((event) => {
      event.registrants = event.registrants.filter(
        (registrant: Interface_UserAttende) =>
          registrant.status === STATUS_ACTIVE
      );
    });

    return events;
  };
