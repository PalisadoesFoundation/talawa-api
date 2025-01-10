import type { EventResolvers } from "../../types/generatedGraphQLTypes";
import { EventAttendee } from "../../models";

/**
 * Resolver function for the `attendees` field of an `Event`.
 *
 * This function retrieves the attendees of an event.
 *
 * @param parent - The parent object representing the event. It contains information about the event, including the ID of the event.
 * @returns A promise that resolves to the user documents found in the database. These documents represent the attendees of the event.
 *
 * @see EventAttendee - The EventAttendee model used to interact with the event attendees collection in the database.
 * @see EventResolvers - The type definition for the resolvers of the Event fields.
 *
 */
export const attendees: EventResolvers["attendees"] = async (parent) => {
  const eventAttendeeObjects = await EventAttendee.find({
    eventId: parent._id,
  })
    .populate("userId")
    .lean();

  return eventAttendeeObjects.map(
    (eventAttendeeObject) => eventAttendeeObject.userId,
  );
};
