import type { EventResolvers } from "../../types/generatedGraphQLTypes";
import { EventAttendee } from "../../models";

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
