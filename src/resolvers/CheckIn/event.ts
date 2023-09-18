import type { CheckInResolvers } from "../../types/generatedGraphQLTypes";
import { EventAttendee } from "../../models";

export const event: CheckInResolvers["event"] = async (parent) => {
  const attendeeObject = await EventAttendee.findOne({
    _id: parent.eventAttendeeId,
  })
    .populate("eventId")
    .lean();

  return attendeeObject?.eventId;
};
