import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Event, EventAttendee } from "../../models";
import {
  USER_NOT_FOUND_ERROR,
  EVENT_NOT_FOUND_ERROR,
  REGISTRANT_ALREADY_EXIST_ERROR,
} from "../../constants";

/**
 * This function enables to register for event.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the event exists.
 * 2. If the user has already registered for the event
 * @returns Updated event.
 */

export const registerForEvent: MutationResolvers["registerForEvent"] = async (
  _parent,
  args,
  context
) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  // Checks whether currentUser with _id == context.userId exists.
  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const event = await Event.findOne({
    _id: args.id,
  }).lean();

  // Checks whether event exists.
  if (!event) {
    throw new errors.NotFoundError(
      requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
      EVENT_NOT_FOUND_ERROR.CODE,
      EVENT_NOT_FOUND_ERROR.PARAM
    );
  }

  const currentUserIsEventRegistrant = await EventAttendee.exists({
    userId: context.userId,
    eventId: args.id,
  });

  if (currentUserIsEventRegistrant) {
    throw new errors.InputValidationError(
      REGISTRANT_ALREADY_EXIST_ERROR.MESSAGE,
      REGISTRANT_ALREADY_EXIST_ERROR.CODE,
      REGISTRANT_ALREADY_EXIST_ERROR.PARAM
    );
  }

  // Adds event._id to registeredEvents list of currentUser with _id === context.userId.
  await User.updateOne(
    {
      _id: context.userId,
    },
    {
      $push: {
        registeredEvents: event._id,
      },
    }
  );

  await EventAttendee.create({
    userId: context.userId,
    eventId: args.id,
  });

  return event;
};
