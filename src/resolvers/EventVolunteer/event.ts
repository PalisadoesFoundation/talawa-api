import { Event } from "../../models";
import type { EventVolunteerResolvers } from "../../types/generatedGraphQLTypes";

export const event: EventVolunteerResolvers["event"] = async (parent) => {
  return await Event.findOne({
    _id: parent.eventId,
  }).lean();
};
