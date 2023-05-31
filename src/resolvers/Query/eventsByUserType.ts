import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceEvent, InterfaceUserAttende } from "../../models";
import { Event, Organization, User } from "../../models";
import { STATUS_ACTIVE } from "../../constants";
import { getSort } from "./helperFunctions/getSort";
/**
 * This query will fetch all events for the organization which have `ACTIVE` status from database.
 * @param _parent-
 * @param args - An object that contains `orderBy` to sort the object as specified and `id` of the Organization.
 * @returns An `events` object that holds all events with `ACTIVE` status for the Organization.
 */

export const eventsByUserType: QueryResolvers["eventsByUserType"] = async (
  _parent,
  args
) => {
  const sort = getSort(args.orderBy);

  const user = await User.findById({ _id: args.userId });
  const organization = await Organization.findById({ _id: args.orgId });
  const filteredEvents: InterfaceEvent[] = [];
  if (user?.userType === "SUPERADMIN") {
    const events = await Event.find({
      organization: args.orgId,
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    events.forEach((event) => {
      event.registrants = event.registrants.filter(
        (registrant: InterfaceUserAttende) =>
          registrant.status === STATUS_ACTIVE
      );
    });
    return events;
  }

  if (organization?.admins.includes(args.userId)) {
    const events = await Event.find({
      organization: args.orgId,
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    events?.forEach((event) => {
      event.registrants = event.registrants.filter(
        (registrant: InterfaceUserAttende) =>
          registrant.status === STATUS_ACTIVE
      );
    });
    return events;
  }
  const events = await Event.find({
    organization: args.orgId,
    status: "ACTIVE",
  })
    .sort(sort)
    .populate("creator", "-password")
    .populate("tasks")
    .populate("admins", "-password")
    .lean();

  events?.forEach((event) => {
    if (event.isPublic) filteredEvents.push(event);
    if (
      !event.isPublic &&
      event.registrants?.some(
        (registrant: InterfaceUserAttende) =>
          registrant.userId === String(args.userId)
      )
    ) {
      filteredEvents.push(event);
    }
  });

  filteredEvents?.forEach((event) => {
    event.registrants = event.registrants.filter(
      (registrant: InterfaceUserAttende) => registrant.status === STATUS_ACTIVE
    );
  });
  return filteredEvents;
};
