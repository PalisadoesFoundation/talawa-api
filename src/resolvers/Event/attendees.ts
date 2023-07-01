import type { EventResolvers } from "../../types/generatedGraphQLTypes";
import { EventAttendee } from "../../models";

export const attendees: EventResolvers["attendees"] = async (parent) => {
  const eventAttendeeObjects = await EventAttendee.find({
    eventId: parent._id,
  })
    .populate("userId")
    .lean();
  return eventAttendeeObjects.map(
    (eventAttendeeObject) => eventAttendeeObject.userId
  );
};
