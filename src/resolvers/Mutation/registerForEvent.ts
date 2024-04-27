import {
  EVENT_NOT_FOUND_ERROR,
  REGISTRANT_ALREADY_EXIST_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceEvent } from "../../models";
import { Event, EventAttendee, User } from "../../models";
import { cacheEvents } from "../../services/EventCache/cacheEvents";
import { findEventsInCache } from "../../services/EventCache/findEventInCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { deleteUserFromCache } from "../../services/UserCache/deleteUserFromCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Enables a user to register for an event.
 *
 * This resolver function allows a user to register for a specific event.
 * It performs the necessary checks to ensure that the user exists, the event exists,
 * and that the user has not already registered for the event.
 *
 * @param _parent - The parent of the current request.
 * @param args - The payload provided with the request, including the ID of the event to register for.
 * @param context - The context of the entire application, containing user authentication and request information.
 * @returns The updated event object after registration.
 * @throws NotFoundError if the specified event is not found.
 * @throws InputValidationError if the current user is already registered for the event.
 * @remarks
 * The function performs the following checks:
 * 1. Checks if the event exists.
 * 2. Checks if the current user has already registered for the event.
 * If the user is invited, their registration status is updated. Otherwise, a new entry is created in the EventAttendee collection.
 */

export const registerForEvent: MutationResolvers["registerForEvent"] = async (
  _parent,
  args,
  context,
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
      EVENT_NOT_FOUND_ERROR.PARAM,
    );
  }

  const currentUserIsEventRegistrant = await EventAttendee.findOne({
    userId: context.userId,
    eventId: args.id,
  });

  if (currentUserIsEventRegistrant?.isRegistered) {
    throw new errors.InputValidationError(
      requestContext.translate(REGISTRANT_ALREADY_EXIST_ERROR.MESSAGE),
      REGISTRANT_ALREADY_EXIST_ERROR.CODE,
      REGISTRANT_ALREADY_EXIST_ERROR.PARAM,
    );
  }

  if (currentUserIsEventRegistrant?.isInvited) {
    currentUserIsEventRegistrant.isRegistered = true;
    currentUserIsEventRegistrant.save();

    // Adds event._id to registeredEvents list of currentUser with _id === context.userId.
    await User.updateOne(
      {
        _id: context.userId,
      },
      {
        $push: {
          registeredEvents: event._id,
        },
      },
    );
    await deleteUserFromCache(context.userId);
    await cacheUsers([context.userId]);

    return currentUserIsEventRegistrant;
  } else {
    // Adds event._id to registeredEvents list of currentUser with _id === context.userId.
    const registeredAttendee = await EventAttendee.create({
      userId: context.userId,
      eventId: args.id,
      isRegistered: true,
    });
    await User.updateOne(
      {
        _id: context.userId,
      },
      {
        $push: {
          registeredEvents: event._id,
        },
      },
    );

    return registeredAttendee.toObject();
  }
};
