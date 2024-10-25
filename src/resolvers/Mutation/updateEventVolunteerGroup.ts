import {
  EVENT_NOT_FOUND_ERROR,
  EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceEventVolunteerGroup } from "../../models";
import { Event, EventVolunteerGroup } from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { adminCheck } from "../../utilities";
import { checkUserExists } from "../../utilities/checks";
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
    const { eventId, description, name, volunteersRequired } = args.data;
    const currentUser = await checkUserExists(context.userId);
    const event = await Event.findById(eventId).populate("organization").lean();
    if (!event) {
      throw new errors.NotFoundError(
        requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
        EVENT_NOT_FOUND_ERROR.CODE,
        EVENT_NOT_FOUND_ERROR.PARAM,
      );
    }

    const userIsEventAdmin = event.admins.some(
      (admin: { toString: () => string }) =>
        admin.toString() === currentUser?._id.toString(),
    );

    const isAdmin = await adminCheck(
      currentUser._id,
      event.organization,
      false,
    );

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

    // Checks if user is Event Admin or Admin of the organization or Leader of the group
    if (
      !isAdmin &&
      !userIsEventAdmin &&
      group.leader.toString() !== currentUser._id.toString()
    ) {
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
          description,
          name,
          volunteersRequired,
        },
      },
      {
        new: true,
      },
    ).lean();

    return updatedGroup as InterfaceEventVolunteerGroup;
  };
