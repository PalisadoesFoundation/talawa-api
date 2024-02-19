import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_ALREADY_INVITED_FOR_EVENT,
} from "../../constants";

import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import type { InterfaceEvent } from "../../models";
import { User, Event, EventAttendee } from "../../models";
import { findEventsInCache } from "../../services/EventCache/findEventInCache";
import { cacheEvents } from "../../services/EventCache/cacheEvents";
import { Types } from "mongoose";

/**
 * Invites an attendee to an event.
 *
 * This resolver function facilitates the invitation process for an attendee to participate in an event.
 * It ensures the current user's authorization, validates the existence of the event, and manages the invitation status
 * to prevent duplicate invitations.
 *
 * @param _parent - The parent resolver.
 * @param args - Arguments containing data for the invitation, including the eventId and userId.
 * @param context - Context object providing information about the current user.
 * @returns Promise resolving to the invited user data.
 * @throws NotFoundError if the user or event is not found.
 * @throws UnauthorizedError if the current user lacks authorization to invite attendees.
 * @throws ConflictError if the user is already invited to the event.
 */

export const inviteEventAttendee: MutationResolvers["inviteEventAttendee"] =
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

    const userAlreadyInvited = await EventAttendee.exists({
      ...args.data,
    });

    if (userAlreadyInvited) {
      throw new errors.ConflictError(
        requestContext.translate(USER_ALREADY_INVITED_FOR_EVENT.MESSAGE),
        USER_ALREADY_INVITED_FOR_EVENT.CODE,
        USER_ALREADY_INVITED_FOR_EVENT.PARAM,
      );
    }

    const invitedUser = await EventAttendee.create({
      ...args.data,
      isInvited: true,
    });

    return invitedUser.toObject();
  };
