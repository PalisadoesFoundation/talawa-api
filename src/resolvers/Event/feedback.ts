import type { EventResolvers } from "../../types/generatedGraphQLTypes";
import { Feedback } from "../../models";

export const feedback: EventResolvers["feedback"] = async (parent) => {
  return Feedback.find({
    eventId: parent._id,
  }).lean();
};
