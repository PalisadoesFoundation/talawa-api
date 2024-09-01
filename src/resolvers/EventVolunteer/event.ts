import { Event } from "../../models";
import type { EventVolunteerResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Resolver function for the `event` field of an `EventVolunteer`.
 *
 * This function retrieves the event associated with a specific event volunteer.
 *
 * @param parent - The parent object representing the event volunteer. It contains information about the event volunteer, including the ID of the event associated with it.
 * @returns A promise that resolves to the event document found in the database. This document represents the event associated with the event volunteer.
 *
 * @see Event - The Event model used to interact with the events collection in the database.
 * @see EventVolunteerResolvers - The type definition for the resolvers of the EventVolunteer fields.
 *
 */
export const event: EventVolunteerResolvers["event"] = async (parent) => {
  return await Event.findOne({
    _id: parent.eventId,
  }).lean();
};
