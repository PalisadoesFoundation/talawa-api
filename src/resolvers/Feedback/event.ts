import type { FeedbackResolvers } from "../../types/generatedGraphQLTypes";
import { Event } from "../../models";

/**
 * Resolver function for the `event` field of a `Feedback`.
 *
 * This function retrieves the event associated with a specific feedback.
 *
 * @param parent - The parent object representing the feedback. It contains information about the feedback, including the ID of the event associated with it.
 * @returns A promise that resolves to the event document found in the database. This document represents the event associated with the feedback.
 *
 * @see Event - The Event model used to interact with the events collection in the database.
 * @see FeedbackResolvers - The type definition for the resolvers of the Feedback fields.
 *
 */
export const event: FeedbackResolvers["event"] = async (parent) => {
  const result = await Event.findOne({
    _id: parent.eventId,
  }).lean();

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return result!;
};
