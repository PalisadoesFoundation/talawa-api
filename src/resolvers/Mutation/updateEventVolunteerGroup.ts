import {
  EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceEventVolunteerGroup, InterfaceUser } from "../../models";
import { EventVolunteerGroup, User } from "../../models";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
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

    if (group.leader.toString() !== context.userId.toString()) {
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
          event:
            args.data?.eventId === undefined ? group.event : args?.data.eventId,
          name: args.data?.name === undefined ? group.name : args?.data.name,
          description:
            args.data?.description === undefined
              ? group.description
              : args?.data.description,
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
