import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { Event, User, EventVolunteerGroup } from "../../models";
import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_AUTHORIZED_ADMIN,
} from "../../constants";
import { errors, requestContext } from "../../libraries";

/**
 * This function enables to create an event volunteer group
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the current user exists
 * 2. If the eventId exists
 * 3. If the current user is admin of event
 * @returns Created event volunteer group
 */

export const createEventVolunteerGroup: MutationResolvers["createEventVolunteerGroup"] =
  async (_parent, args, context) => {
    const currentUser = await User.findOne({ _id: context.userId }).lean();
    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }
    const event = await Event.findById(args.data.eventId);
    if (!event) {
      throw new errors.NotFoundError(
        requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
        EVENT_NOT_FOUND_ERROR.CODE,
        EVENT_NOT_FOUND_ERROR.PARAM
      );
    }

    const userIsEventAdmin = event.admins.some(
      (admin) => admin.toString() === currentUser._id.toString()
    );

    if (!userIsEventAdmin) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM
      );
    }

    const createdVolunteerGroup = await EventVolunteerGroup.create({
      eventId: args.data.eventId,
      creatorId: context.userId,
      leaderId: context.userId,
      name: args.data.name,
      volunteersRequired: args.data?.volunteersRequired,
    });

    await Event.findOneAndUpdate(
      {
        _id: args.data.eventId,
      },
      {
        $push: {
          volunteerGroups: createdVolunteerGroup._id,
        },
      }
    );

    return createdVolunteerGroup.toObject();
  };
