import type { CheckInResolvers } from "../../types/generatedGraphQLTypes";
import { EventAttendee } from "../../models";

/**
 * Resolver function for the `user` field of a `CheckIn`.
 *
 * This function retrieves the user who checked in to an event.
 *
 * @param parent - The parent object representing the check-in. It contains information about the check-in, including the ID of the event attendee who checked in.
 * @returns A promise that resolves to the user document found in the database. This document represents the user who checked in to the event.
 *
 * @see EventAttendee - The EventAttendee model used to interact with the event attendees collection in the database.
 * @see CheckInResolvers - The type definition for the resolvers of the CheckIn fields.
 *
 */
export const user: CheckInResolvers["user"] = async (parent) => {
  const attendeeObject = await EventAttendee.findOne({
    _id: parent.eventAttendeeId,
  })
    .populate("userId")
    .lean();

  return attendeeObject?.userId;
};
