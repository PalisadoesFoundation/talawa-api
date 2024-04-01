import { Event } from "../../models";
import type { EventVolunteerGroupResolvers } from "../../types/generatedGraphQLTypes";

export const event: EventVolunteerGroupResolvers["event"] = async (parent) => {
  return await Event.findOne({
    _id: parent.eventId,
  }).lean();
};
