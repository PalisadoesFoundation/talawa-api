import type { EventResolvers } from "../../types/generatedGraphQLTypes";
import { EventAttendee } from "../../models";

/**
 * Resolver function for the `attendeesCheckInStatus` field of an `Event`.
 *
 * This function retrieves the attendees of an event and their check-in status.
 *
 * @param parent - The parent object representing the event. It contains information about the event, including the ID.
 * @returns A promise that resolves to an array of objects. Each object contains information about an attendee of the event, including the user document and the check-in document.
 *
 * @see EventAttendee - The EventAttendee model used to interact with the event attendees collection in the database.
 * @see EventResolvers - The type definition for the resolvers of the Event fields.
 *
 */
export const attendeesCheckInStatus: EventResolvers["attendeesCheckInStatus"] =
  async (parent) => {
    const eventAttendeeObjects = await EventAttendee.find({
      eventId: parent._id,
    })
      .populate("userId")
      .populate("checkInId")
      .lean();

    return eventAttendeeObjects.map((obj) => ({
      user: obj.userId,
      _id: obj._id.toString(),
      checkIn: obj.checkInId,
    }));
  };
