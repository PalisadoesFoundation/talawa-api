import {
  EVENT_VOLUNTEER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceUser } from "../../models";
import { EventVolunteer, EventVolunteerGroup, User } from "../../models";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * This function enables to remove an Event Volunteer.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the current user exists
 * 2. If the Event volunteer to be removed exists.
 * 3. If the current user is leader of the corresponding event volunteer group.
 * @returns Event Volunteer.
 */

export const removeEventVolunteer: MutationResolvers["removeEventVolunteer"] =
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

    const volunteer = await EventVolunteer.findOne({
      _id: args.id,
    });

    if (!volunteer) {
      throw new errors.NotFoundError(
        requestContext.translate(EVENT_VOLUNTEER_NOT_FOUND_ERROR.MESSAGE),
        EVENT_VOLUNTEER_NOT_FOUND_ERROR.CODE,
        EVENT_VOLUNTEER_NOT_FOUND_ERROR.PARAM,
      );
    }

    const group = await EventVolunteerGroup.findById(volunteer.group);

    const userIsLeader =
      group?.leader.toString() === currentUser._id.toString();

    if (!userIsLeader) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    await EventVolunteer.deleteOne({
      _id: args.id,
    });

    await EventVolunteerGroup.updateOne(
      {
        _id: volunteer.group,
      },
      {
        $pull: {
          volunteers: volunteer._id,
        },
      },
    );

    return volunteer;
  };
