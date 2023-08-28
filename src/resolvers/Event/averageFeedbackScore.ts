import type { EventResolvers } from "../../types/generatedGraphQLTypes";
import { Feedback } from "../../models";

export const averageFeedbackScore: EventResolvers["averageFeedbackScore"] =
  async (parent) => {
    const feedbacks = await Feedback.find({
      eventId: parent._id,
    })
      .select("rating")
      .lean();

    // Return null if no feedback has been submitted
    if (feedbacks.length === 0) return null;

    // Return the average feedback score
    const sum = feedbacks.reduce(
      (accumulator, feedback) => accumulator + feedback.rating,
      0
    );
    return sum / feedbacks.length;
  };
