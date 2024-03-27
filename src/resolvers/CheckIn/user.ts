import type { CheckInResolvers } from "../../types/generatedGraphQLTypes";
import { EventAttendee } from "../../models";

export const user: CheckInResolvers["user"] = async (parent) => {
  const attendeeObject = await EventAttendee.findOne({
    _id: parent.eventAttendeeId,
  })
    .populate("userId")
    .lean();

  return attendeeObject?.userId;
};
