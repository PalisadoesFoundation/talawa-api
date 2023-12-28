import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_CHECKED_IN,
  USER_NOT_REGISTERED_FOR_EVENT,
  FEEDBACK_ALREADY_SUBMITTED,
  TRANSACTION_LOG_TYPES,
} from "../../constants";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { Event, EventAttendee, CheckIn, Feedback } from "../../models";
import { storeTransaction } from "../../utilities/storeTransaction";

export const addFeedback: MutationResolvers["addFeedback"] = async (
  _parent,
  args,
  context
) => {
  const currentEventExists = await Event.exists({
    _id: args.data.eventId,
  });

  if (!currentEventExists) {
    throw new errors.NotFoundError(
      requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
      EVENT_NOT_FOUND_ERROR.CODE,
      EVENT_NOT_FOUND_ERROR.PARAM
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
      USER_NOT_REGISTERED_FOR_EVENT.PARAM
    );
  }

  if (eventAttendeeObject.checkInId === null) {
    throw new errors.ConflictError(
      requestContext.translate(USER_NOT_CHECKED_IN.MESSAGE),
      USER_NOT_CHECKED_IN.CODE,
      USER_NOT_CHECKED_IN.PARAM
    );
  }

  if (eventAttendeeObject.checkInId.feedbackSubmitted) {
    throw new errors.ConflictError(
      requestContext.translate(FEEDBACK_ALREADY_SUBMITTED.MESSAGE),
      FEEDBACK_ALREADY_SUBMITTED.CODE,
      FEEDBACK_ALREADY_SUBMITTED.PARAM
    );
  }

  await CheckIn.findByIdAndUpdate(eventAttendeeObject.checkInId, {
    feedbackSubmitted: true,
  });
  storeTransaction(
    context.userId,
    TRANSACTION_LOG_TYPES.UPDATE,
    "CheckIn",
    `CheckIn:${eventAttendeeObject.checkInId} updated feedbackSubmitted`
  );

  const feedback = await Feedback.create({ ...args.data });
  storeTransaction(
    context.userId,
    TRANSACTION_LOG_TYPES.CREATE,
    "Feedback",
    `Feedback:${feedback._id} created`
  );

  return feedback;
};
