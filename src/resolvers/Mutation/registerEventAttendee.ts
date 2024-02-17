import {
  EVENT_NOT_FOUND_ERROR,
  USER_ALREADY_REGISTERED_FOR_EVENT,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import type { InterfaceEvent } from "../../models";
import { User, Event, EventAttendee } from "../../models";
import { findEventsInCache } from "../../services/EventCache/findEventInCache";
import { cacheEvents } from "../../services/EventCache/cacheEvents";
import { Types } from "mongoose";

/**
 * Registers an attendee for an event.
 *
 * This function handles the registration process for an attendee to participate in an event.
 * It checks the user's authorization, verifies the event's existence, and manages the registration status
 * based on whether the user was invited or directly registered.
 *
 * @param _parent - The parent resolver.
 * @param args - Arguments passed to the resolver containing registration data.
 * @param context - Context object containing user authentication and request information.
 * @returns Promise<object> Returns a promise resolving to the registered attendee data.
 * @throws NotFoundError Throws a NotFoundError if the user or event is not found.
 * @throws UnauthorizedError Throws an UnauthorizedError if the current user is not authorized to register attendees.
 */

export const registerEventAttendee: MutationResolvers["registerEventAttendee"] =
  async (_parent, args, context) => {
    const currentUser = await User.findOne({
      _id: context.userId,
    });

    if (currentUser === null) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    let event: InterfaceEvent | null;

    const eventFoundInCache = await findEventsInCache([args.data.eventId]);

    event = eventFoundInCache[0];

    if (eventFoundInCache[0] === null) {
      event = await Event.findOne({
        _id: args.data.eventId,
      }).lean();

      if (event !== null) {
        await cacheEvents([event]);
      }
    }

    if (event === null) {
      throw new errors.NotFoundError(
        requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
        EVENT_NOT_FOUND_ERROR.CODE,
        EVENT_NOT_FOUND_ERROR.PARAM,
      );
    }

    const isUserEventAdmin = event.admins.some(
      (admin) =>
        admin === context.userID ||
        Types.ObjectId(admin).equals(context.userId),
    );

    if (!isUserEventAdmin && currentUser.userType !== "SUPERADMIN") {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    const requestUser = await User.findOne({
      _id: args.data.userId,
    }).lean();

    if (requestUser === null) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    const eventAttendee = await EventAttendee.findOne({
      ...args.data,
    });

    // If user is already registered for the event

    if (eventAttendee?.isRegistered) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_ALREADY_REGISTERED_FOR_EVENT.MESSAGE),
        USER_ALREADY_REGISTERED_FOR_EVENT.CODE,
        USER_ALREADY_REGISTERED_FOR_EVENT.PARAM,
      );
    }

    // If user is already invitedForEvent
    if (eventAttendee?.isInvited) {
      eventAttendee.isRegistered = true;
      await eventAttendee.save();

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

      return eventAttendee;
    }

    // If user is directly invitedForEvent
    const registerAttendee = await EventAttendee.create({
      ...args.data,
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

    return registerAttendee.toObject();
  };
