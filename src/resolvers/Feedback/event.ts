import type { FeedbackResolvers } from "../../types/generatedGraphQLTypes";
import { Event } from "../../models";

export const event: FeedbackResolvers["event"] = async (parent) => {
  return await Event.findOne({
    _id: parent.eventId,
  }).lean();
};
