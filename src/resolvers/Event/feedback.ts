import type { EventResolvers } from "../../types/generatedGraphQLTypes";
import { Feedback } from "../../models";

/**
 * Resolver function for the `feedback` field of an `Event`.
 *
 * This function retrieves the feedback associated with a specific event.
 *
 * @param parent - The parent object representing the event. It contains information about the event, including the ID of the feedback associated with it.
 * @returns A promise that resolves to an array of feedback documents found in the database. These documents represent the feedback associated with the event.
 *
 * @see Feedback - The Feedback model used to interact with the feedback collection in the database.
 * @see EventResolvers - The type definition for the resolvers of the Event fields.
 *
 */
export const feedback: EventResolvers["feedback"] = async (parent) => {
  return Feedback.find({
    eventId: parent._id,
  }).lean();
};
