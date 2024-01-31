import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { EventVolunteer } from "../../models/EventVolunteer";
import { Event, User } from "../../models";
import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  EVENT_VOLUNTEER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";

/**
 * This function enables to create an event volunteer.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the current user exists
 * 2. if the volunteer user exists
 * 3. If the event exists, (if sent in args)
 * @returns Created event volunteer
 */

export const createEventVolunteer: MutationResolvers["createEventVolunteer"] =
  async (_parent, args, context) => {
    const currentUser = await User.findOne({ _id: context.userId }).lean();
    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }
    const volunteerUser = await User.findOne({ _id: args.data?.userId }).lean();
    if (!volunteerUser) {
      throw new errors.NotFoundError(
        requestContext.translate(EVENT_VOLUNTEER_NOT_FOUND_ERROR.MESSAGE),
        EVENT_VOLUNTEER_NOT_FOUND_ERROR.CODE,
        EVENT_VOLUNTEER_NOT_FOUND_ERROR.PARAM
      );
    }
    if (args.data?.eventId) {
      const event = await Event.findById(args.data?.eventId);
      if (!event) {
        throw new errors.NotFoundError(
          requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
          EVENT_NOT_FOUND_ERROR.CODE,
          EVENT_NOT_FOUND_ERROR.PARAM
        );
      }
    }
    const createdVolunteer = await EventVolunteer.create({
      userId: args.data.userId,
      eventId: args.data.eventId,
      isAssigned: false,
      isInvited: true,
      creatorId: context.userId,
    });
    return createdVolunteer.toObject();
  };
