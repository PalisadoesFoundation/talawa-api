import type { CheckInResolvers } from "../../types/generatedGraphQLTypes";
import { EventAttendee } from "../../models";

/**
 * Resolver function for the `event` field of a `CheckIn`.
 *
 * This function retrieves the event associated with a specific check-in.
 *
 * @param parent - The parent object representing the check-in. It contains information about the check-in, including the ID of the event attendee it is associated with.
 * @returns A promise that resolves to the event document found in the database. This document represents the event associated with the check-in.
 *
 * @see EventAttendee - The EventAttendee model used to interact with the event attendees collection in the database.
 * @see CheckInResolvers - The type definition for the resolvers of the CheckIn fields.
 *
 */
export const event: CheckInResolvers["event"] = async (parent) => {
  const attendeeObject = await EventAttendee.findOne({
    _id: parent.eventAttendeeId,
  })
    .populate("eventId")
    .lean();

  return attendeeObject?.eventId;
};
