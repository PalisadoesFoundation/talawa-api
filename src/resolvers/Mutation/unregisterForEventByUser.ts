import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Event, EventAttendee } from "../../models";
import {
  USER_NOT_FOUND_ERROR,
  EVENT_NOT_FOUND_ERROR,
  USER_ALREADY_UNREGISTERED_ERROR,
} from "../../constants";

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
    const currentUserExists = await User.exists({
      _id: context.userId,
    });

    // checks if current user exists
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

    // checks if there exists an event with _id === args.id
    if (!event) {
      throw new errors.NotFoundError(
        requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
        EVENT_NOT_FOUND_ERROR.CODE,
        EVENT_NOT_FOUND_ERROR.PARAM
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
        USER_ALREADY_UNREGISTERED_ERROR.PARAM
      );
    }

    await EventAttendee.deleteOne({
      userId: context.userId,
      eventId: args.id,
    });

    return event;
  };
