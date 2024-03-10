import type { FeedbackResolvers } from "../../types/generatedGraphQLTypes";
import { Event } from "../../models";

export const event: FeedbackResolvers["event"] = async (parent) => {
  const result = await Event.findOne({
    _id: parent.eventId,
  }).lean();

  return result!;
};
