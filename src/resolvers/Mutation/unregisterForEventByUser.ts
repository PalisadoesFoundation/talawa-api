import {
  EVENT_NOT_FOUND_ERROR,
  USER_ALREADY_UNREGISTERED_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceEvent } from "../../models";
import { Event, EventAttendee } from "../../models";
import { cacheEvents } from "../../services/EventCache/cacheEvents";
import { findEventsInCache } from "../../services/EventCache/findEventInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * This function enables a user to unregister from an event.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the event exists.
 * 3. If the user is a registrant of the event.
 * @returns Updated event.
 */

export const unregisterForEventByUser: MutationResolvers["unregisterForEventByUser"] =
  async (_parent, args, context) => {
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
    // checks if there exists an event with _id === args.id
    if (!event) {
      throw new errors.NotFoundError(
        requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
        EVENT_NOT_FOUND_ERROR.CODE,
        EVENT_NOT_FOUND_ERROR.PARAM,
      );
    }

    const userRegisteredForEvent = await EventAttendee.exists({
      userId: context.userId,
      eventId: args.id,
    });

    if (!userRegisteredForEvent) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_ALREADY_UNREGISTERED_ERROR.MESSAGE),
        USER_ALREADY_UNREGISTERED_ERROR.CODE,
        USER_ALREADY_UNREGISTERED_ERROR.PARAM,
      );
    }

    await EventAttendee.deleteOne({
      userId: context.userId,
      eventId: args.id,
    });

    return event;
  };
