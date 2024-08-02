import type { EventResolvers } from "../../types/generatedGraphQLTypes";
import { Event } from "../../models";

/**
 * Resolver function for the `baseRecurringEvent` field of an `Event`.
 *
 * This function retrieves the base recurring event of a specific event.
 *
 * @param parent - The parent object representing the event. It contains information about the event, including the ID of the base recurring event.
 * @returns A promise that resolves to the event document found in the database. This document represents the base recurring event of the event.
 *
 * @see Event - The Event model used to interact with the events collection in the database.
 * @see EventResolvers - The type definition for the resolvers of the Event fields.
 *
 */
export const baseRecurringEvent: EventResolvers["baseRecurringEvent"] = async (
  parent,
) => {
  return await Event.findOne({
    _id: parent.baseRecurringEventId,
  }).lean();
};
