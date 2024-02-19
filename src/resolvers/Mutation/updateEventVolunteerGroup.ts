import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import {
  EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import type { InterfaceEventVolunteerGroup } from "../../models";
import { EventVolunteerGroup, User } from "../../models";
import { errors, requestContext } from "../../libraries";
/**
 * This function enables to update the Event Volunteer Group
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. Whether the user exists
 * 2. Whether the EventVolunteerGroup exists
 * 3. Whether the current user is the leader of EventVolunteerGroup
 */
export const updateEventVolunteerGroup: MutationResolvers["updateEventVolunteerGroup"] =
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

    const group = await EventVolunteerGroup.findOne({
      _id: args.id,
    }).lean();

    if (!group) {
      throw new errors.NotFoundError(
        requestContext.translate(EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR.MESSAGE),
        EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR.CODE,
        EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR.PARAM,
      );
    }

    if (group.leaderId.toString() !== context.userId.toString()) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    const updatedGroup = await EventVolunteerGroup.findOneAndUpdate(
      {
        _id: args.id,
      },
      {
        $set: {
          eventId:
            args.data?.eventId === undefined
              ? group.eventId
              : args?.data.eventId,
          name: args.data?.name === undefined ? group.name : args?.data.name,
          volunteersRequired:
            args.data?.volunteersRequired === undefined
              ? group.volunteersRequired
              : args?.data.volunteersRequired,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    ).lean();

    return updatedGroup as InterfaceEventVolunteerGroup;
  };
