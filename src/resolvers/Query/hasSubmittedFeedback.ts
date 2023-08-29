import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { User, Event, EventAttendee } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_CHECKED_IN,
  USER_NOT_REGISTERED_FOR_EVENT,
} from "../../constants";

export const hasSubmittedFeedback: QueryResolvers["hasSubmittedFeedback"] =
  async (_parent, args) => {
    const currentUserExists = await User.exists({
      _id: args.userId,
    });

    if (!currentUserExists) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }

    const currentEventExists = await Event.exists({
      _id: args.eventId,
    });

    if (!currentEventExists) {
      throw new errors.NotFoundError(
        requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
        EVENT_NOT_FOUND_ERROR.CODE,
        EVENT_NOT_FOUND_ERROR.PARAM
      );
    }

    const eventAttendeeObject = await EventAttendee.findOne({
      ...args,
    })
      .populate("checkInId")
      .lean();

    if (eventAttendeeObject === null) {
      throw new errors.ConflictError(
        requestContext.translate(USER_NOT_REGISTERED_FOR_EVENT),
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

    return eventAttendeeObject.checkInId.feedbackSubmitted;
  };
