import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import type { InterfaceEvent } from "../../models";
import { User, Event, EventAttendee } from "../../models";
import {
  EVENT_NOT_FOUND_ERROR,
  REGISTRANT_ALREADY_EXIST_ERROR,
  TRANSACTION_LOG_TYPES,
} from "../../constants";
import { findEventsInCache } from "../../services/EventCache/findEventInCache";
import { cacheEvents } from "../../services/EventCache/cacheEvents";
import { storeTransaction } from "../../utilities/storeTransaction";

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
  let event: InterfaceEvent | null;

  const eventFoundInCache = await findEventsInCache([args.id]);

  event = eventFoundInCache[0];

  if (eventFoundInCache[0] === null) {
    event = await Event.findOne({
      _id: args.id,
    }).lean();

    if (event !== null) {
      await cacheEvents([event]);
    }
  }

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
      requestContext.translate(REGISTRANT_ALREADY_EXIST_ERROR.MESSAGE),
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
  await storeTransaction(
    context.userId,
    TRANSACTION_LOG_TYPES.UPDATE,
    "User",
    `User:${context.userId} updated registeredEvents`
  );

  const createdAttendee = await EventAttendee.create({
    userId: context.userId,
    eventId: args.id,
  });
  await storeTransaction(
    context.userId,
    TRANSACTION_LOG_TYPES.CREATE,
    "EventAttendee",
    `EventAttendee:${createdAttendee._id} created`
  );

  return event;
};
