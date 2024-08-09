import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { EventAttendee } from "../../models";

/**
 * Retrieves an attendee record for a specific event and user from the database.
 *
 * This function performs the following steps:
 * 1. Queries the database to find an `EventAttendee` record that matches the provided event ID and user ID.
 * 2. Returns the found attendee record, or `null` if no matching record is found.
 *
 * @param _parent - This parameter is not used in this resolver function but is included for compatibility with GraphQL resolver signatures.
 * @param args - The arguments provided by the GraphQL query, including:
 *   - `eventId`: The ID of the event for which the attendee is being retrieved.
 *   - `userId`: The ID of the user for whom the attendee record is being retrieved.
 *
 * @returns The attendee record for the specified event and user, or `null` if no record is found.
 */

export const getEventAttendee: QueryResolvers["getEventAttendee"] = async (
  _parent,
  args,
) => {
  const eventAttendee = await EventAttendee.findOne({
    eventId: args.eventId,
    userId: args.userId,
  }).lean();

  return eventAttendee;
};
