import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_CHECKED_IN,
  USER_NOT_REGISTERED_FOR_EVENT,
  FEEDBACK_ALREADY_SUBMITTED,
} from "../../constants";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { Event, EventAttendee, CheckIn, Feedback } from "../../models";

/**
 * Mutation resolver function to add feedback for an event.
 *
 * This function pcerforms the following ations:
 * 1. Checks if the specified event exists.
 * 2. Retrieves the event attendee record for the current user and event.
 * 3. Checks if the user is registered for the event and if they have checked in.
 * 4. Ensures the user has not already submitted feedback for the event.
 * 5. Updates the check-in record to mark feedback as submitted.
 * 6. Creates and saves a new feedback entry.
 *
 * @param _parent - The parent object for the mutation. Typically, this is not used in this resolver.
 * @param args - The arguments for the mutation, including:
 *   - `data.eventId`: The ID of the event for which feedback is being submitted.
 *   - `data.feedback`: The feedback content to be submitted.
 * @param context - The context for the mutation, including:
 *   - `userId`: The ID of the current user making the request.
 *
 * @returns A promise that resolves to the newly created feedback document.
 *
 * @see Event - The Event model used to interact with the events collection in the database.
 * @see EventAttendee - The EventAttendee model used to manage event attendee records.
 * @see CheckIn - The CheckIn model used to manage check-in records.
 * @see Feedback - The Feedback model used to create and manage feedback entries.
 * @see MutationResolvers - The type definition for the mutation resolvers.
 */
export const addFeedback: MutationResolvers["addFeedback"] = async (
  _parent,
  args,
  context,
) => {
  const currentEventExists = await Event.exists({
    _id: args.data.eventId,
  });

  if (!currentEventExists) {
    throw new errors.NotFoundError(
      requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
      EVENT_NOT_FOUND_ERROR.CODE,
      EVENT_NOT_FOUND_ERROR.PARAM,
    );
  }

  const eventAttendeeObject = await EventAttendee.findOne({
    eventId: args.data.eventId,
    userId: context.userId,
  })
    .populate("checkInId")
    .lean();

  if (eventAttendeeObject === null) {
    throw new errors.ConflictError(
      requestContext.translate(USER_NOT_REGISTERED_FOR_EVENT.MESSAGE),
      USER_NOT_REGISTERED_FOR_EVENT.CODE,
      USER_NOT_REGISTERED_FOR_EVENT.PARAM,
    );
  }

  if (eventAttendeeObject.checkInId === null) {
    throw new errors.ConflictError(
      requestContext.translate(USER_NOT_CHECKED_IN.MESSAGE),
      USER_NOT_CHECKED_IN.CODE,
      USER_NOT_CHECKED_IN.PARAM,
    );
  }

  if (eventAttendeeObject.checkInId.feedbackSubmitted) {
    throw new errors.ConflictError(
      requestContext.translate(FEEDBACK_ALREADY_SUBMITTED.MESSAGE),
      FEEDBACK_ALREADY_SUBMITTED.CODE,
      FEEDBACK_ALREADY_SUBMITTED.PARAM,
    );
  }

  await CheckIn.findByIdAndUpdate(eventAttendeeObject.checkInId, {
    feedbackSubmitted: true,
  });

  const feedback = await Feedback.create({ ...args.data });

  return feedback;
};
