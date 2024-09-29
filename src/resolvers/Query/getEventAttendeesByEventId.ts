import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { EventAttendee } from "../../models";
/**
 * Retrieves all attendees for a specific event from the database.
 *
 * This function performs the following steps:
 * 1. Queries the database to find all `EventAttendee` records that match the provided event ID.
 * 2. Returns an array of attendee records for the specified event.
 *
 * @param _parent - This parameter is not used in this resolver function but is included for compatibility with GraphQL resolver signatures.
 * @param args - The arguments provided by the GraphQL query, including:
 *   - `eventId`: The ID of the event for which attendees are being retrieved.
 *
 * @returns An array of attendee records for the specified event.
 */
export const getEventAttendeesByEventId: QueryResolvers["getEventAttendeesByEventId"] =
  async (_parent, args) => {
    const eventAttendees = await EventAttendee.find({
      eventId: args.eventId,
    }).lean();

    return eventAttendees;
  };
