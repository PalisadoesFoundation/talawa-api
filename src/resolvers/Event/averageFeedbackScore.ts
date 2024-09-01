import type { EventResolvers } from "../../types/generatedGraphQLTypes";
import { Feedback } from "../../models";

/**
 * Resolver function for the `averageFeedbackScore` field of an `Event`.
 *
 * This function calculates the average feedback score for a specific event.
 *
 * @param parent - The parent object representing the event. It contains information about the event, including the ID of the feedback associated with it.
 * @returns A promise that resolves to the average feedback score for the event.
 *
 * @see Feedback - The Feedback model used to interact with the feedback collection in the database.
 * @see EventResolvers - The type definition for the resolvers of the Event fields.
 *
 */
export const averageFeedbackScore: EventResolvers["averageFeedbackScore"] =
  async (parent) => {
    const feedbacks = await Feedback.find({
      eventId: parent._id,
    })
      .select("rating")
      .lean();

    if (feedbacks.length === 0) return 0;

    // Return the average feedback score
    const sum = feedbacks.reduce(
      (accumulator, feedback) => accumulator + feedback.rating,
      0,
    );
    return sum / feedbacks.length;
  };
