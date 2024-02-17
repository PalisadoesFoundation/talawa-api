import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_REGISTERED_FOR_EVENT,
} from "../../constants";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import type { InterfaceEvent } from "../../models";
import { User, Event, EventAttendee, AppUserProfile } from "../../models";
import { findEventsInCache } from "../../services/EventCache/findEventInCache";
import { cacheEvents } from "../../services/EventCache/cacheEvents";

export const removeEventAttendee: MutationResolvers["removeEventAttendee"] =
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
    const currentUserAppProfile = await AppUserProfile.findOne({
      userId: currentUser._id,
    }).lean();
    if (!currentUserAppProfile) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }
    let currentEvent: InterfaceEvent | null;

    const eventFoundInCache = await findEventsInCache([args.data.eventId]);

    currentEvent = eventFoundInCache[0];

    if (eventFoundInCache[0] === null) {
      currentEvent = await Event.findOne({
        _id: args.data.eventId,
      }).lean();

      if (currentEvent !== null) {
        await cacheEvents([currentEvent]);
      }
    }

    if (currentEvent === null) {
      throw new errors.NotFoundError(
        requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
        EVENT_NOT_FOUND_ERROR.CODE,
        EVENT_NOT_FOUND_ERROR.PARAM,
      );
    }

    const isUserEventAdmin = currentEvent.admins.some(
      (admin) => admin.toString() === context.userId.toString(),
    );

    if (!isUserEventAdmin && currentUserAppProfile.isSuperAdmin === false) {
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

    const userAlreadyAttendee = await EventAttendee.exists({
      ...args.data,
    });

    if (!userAlreadyAttendee) {
      throw new errors.ConflictError(
        requestContext.translate(USER_NOT_REGISTERED_FOR_EVENT.MESSAGE),
        USER_NOT_REGISTERED_FOR_EVENT.CODE,
        USER_NOT_REGISTERED_FOR_EVENT.PARAM,
      );
    }

    await EventAttendee.deleteOne({ ...args.data });

    return requestUser;
  };
