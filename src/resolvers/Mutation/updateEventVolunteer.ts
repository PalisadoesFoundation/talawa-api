import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import type { EventVolunteerResponse } from "../../constants";
import {
  EVENT_VOLUNTEER_INVITE_USER_MISTMATCH,
  EVENT_VOLUNTEER_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import type { InterfaceEventVolunteer } from "../../models";
import { User, EventVolunteer } from "../../models";
import { errors, requestContext } from "../../libraries";
/**
 * This function enables to update an Event Volunteer
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. Whether the user exists
 * 2. Whether the EventVolunteer exists
 * 3. Whether the current user is the user of EventVolunteer
 * 4. Whether the EventVolunteer is invited
 */
export const updateEventVolunteer: MutationResolvers["updateEventVolunteer"] =
  async (_parent, args, context) => {
    const currentUser = await User.findOne({
      _id: context.userId,
    }).lean();

    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    const eventVolunteer = await EventVolunteer.findOne({
      _id: args.id,
    }).lean();

    if (!eventVolunteer) {
      throw new errors.NotFoundError(
        requestContext.translate(EVENT_VOLUNTEER_NOT_FOUND_ERROR.MESSAGE),
        EVENT_VOLUNTEER_NOT_FOUND_ERROR.CODE,
        EVENT_VOLUNTEER_NOT_FOUND_ERROR.PARAM,
      );
    }

    if (eventVolunteer.userId.toString() !== context.userId.toString()) {
      throw new errors.ConflictError(
        requestContext.translate(EVENT_VOLUNTEER_INVITE_USER_MISTMATCH.MESSAGE),
        EVENT_VOLUNTEER_INVITE_USER_MISTMATCH.CODE,
        EVENT_VOLUNTEER_INVITE_USER_MISTMATCH.PARAM,
      );
    }

    const updatedVolunteer = await EventVolunteer.findOneAndUpdate(
      {
        _id: args.id,
      },
      {
        $set: {
          eventId:
            args.data?.eventId === undefined
              ? eventVolunteer.eventId
              : (args?.data.eventId as string),
          isAssigned:
            args.data?.isAssigned === undefined
              ? eventVolunteer.isAssigned
              : (args.data?.isAssigned as boolean),
          isInvited:
            args.data?.isInvited === undefined
              ? eventVolunteer.isInvited
              : (args.data?.isInvited as boolean),
          response:
            args.data?.response === undefined
              ? eventVolunteer.response
              : (args.data?.response as EventVolunteerResponse),
        },
      },
      {
        new: true,
        runValidators: true,
      },
    ).lean();

    return updatedVolunteer as InterfaceEventVolunteer;
  };
