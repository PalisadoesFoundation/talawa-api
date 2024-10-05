import { Event } from "../../models";
import type { EventVolunteerGroupResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Resolver function for the `event` field of an `EventVolunteerGroup`.
 *
 * This function retrieves the event associated with a specific event volunteer group.
 *
 * @param parent - The parent object representing the event volunteer group. It contains information about the event volunteer group, including the ID of the event associated with it.
 * @returns A promise that resolves to the event document found in the database. This document represents the event associated with the event volunteer group.
 *
 * @see Event - The Event model used to interact with the events collection in the database.
 * @see EventVolunteerGroupResolvers - The type definition for the resolvers of the EventVolunteerGroup fields.
 *
 */
export const event: EventVolunteerGroupResolvers["event"] = async (parent) => {
  return await Event.findOne({
    _id: parent.event,
  }).lean();
};
