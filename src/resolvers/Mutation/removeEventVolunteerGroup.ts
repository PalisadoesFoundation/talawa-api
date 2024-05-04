import {
  EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceUser } from "../../models";
import { Event, EventVolunteer, EventVolunteerGroup, User } from "../../models";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * This function enables to remove an Event Volunteer Group.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the current user exists
 * 2. If the Event volunteer group to be removed exists.
 * 3. If the current user is the admin of the corresponding event
 * @returns Event Volunteer group.
 */

export const removeEventVolunteerGroup: MutationResolvers["removeEventVolunteerGroup"] =
  async (_parent, args, context) => {
    let currentUser: InterfaceUser | null;
    const userFoundInCache = await findUserInCache([context.userId]);
    currentUser = userFoundInCache[0];
    if (currentUser === null) {
      currentUser = await User.findOne({
        _id: context.userId,
      }).lean();
      if (currentUser !== null) {
        await cacheUsers([currentUser]);
      }
    }

    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    const volunteerGroup = await EventVolunteerGroup.findOne({
      _id: args.id,
    });

    if (!volunteerGroup) {
      throw new errors.NotFoundError(
        requestContext.translate(EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR.MESSAGE),
        EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR.CODE,
        EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR.PARAM,
      );
    }

    const event = await Event.findById(volunteerGroup.eventId);

    const userIsEventAdmin = event?.admins.some(
      (admin) => admin._id.toString() === currentUser?._id.toString(),
    );

    if (!userIsEventAdmin) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    await EventVolunteerGroup.deleteOne({
      _id: args.id,
    });

    await EventVolunteer.deleteMany({
      groupId: args.id,
    });

    return volunteerGroup;
  };
