import {
  EVENT_NOT_FOUND_ERROR,
  EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR,
  EVENT_VOLUNTEER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceUser } from "../../models";
import { Event, EventVolunteerGroup, User } from "../../models";
import { EventVolunteer } from "../../models/EventVolunteer";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Creates a new event volunteer entry.
 *
 * This function performs the following actions:
 * 1. Verifies the existence of the current user.
 * 2. Verifies the existence of the volunteer user.
 * 3. Verifies the existence of the event.
 * 4. Verifies the existence of the volunteer group.
 * 5. Ensures that the current user is the leader of the volunteer group.
 * 6. Creates a new event volunteer record.
 * 7. Adds the newly created volunteer to the group's list of volunteers.
 *
 * @param _parent - The parent object for the mutation. This parameter is not used in this resolver.
 * @param args - The arguments for the mutation, including:
 *   - `data.userId`: The ID of the user to be assigned as a volunteer.
 *   - `data.eventId`: The ID of the event for which the volunteer is being created.
 *   - `data.groupId`: The ID of the volunteer group to which the user is being added.
 * @param context - The context for the mutation, including:
 *   - `userId`: The ID of the current user performing the operation.
 *
 * @returns The created event volunteer record.
 *
 */
export const createEventVolunteer: MutationResolvers["createEventVolunteer"] =
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
    const volunteerUser = await User.findOne({ _id: args.data?.userId }).lean();
    if (!volunteerUser) {
      throw new errors.NotFoundError(
        requestContext.translate(EVENT_VOLUNTEER_NOT_FOUND_ERROR.MESSAGE),
        EVENT_VOLUNTEER_NOT_FOUND_ERROR.CODE,
        EVENT_VOLUNTEER_NOT_FOUND_ERROR.PARAM,
      );
    }
    const event = await Event.findById(args.data.eventId);
    if (!event) {
      throw new errors.NotFoundError(
        requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
        EVENT_NOT_FOUND_ERROR.CODE,
        EVENT_NOT_FOUND_ERROR.PARAM,
      );
    }
    const group = await EventVolunteerGroup.findOne({
      _id: args.data.groupId,
    }).lean();
    if (!group) {
      throw new errors.NotFoundError(
        requestContext.translate(EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR.MESSAGE),
        EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR.CODE,
        EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR.PARAM,
      );
    }

    if (group.leader.toString() !== currentUser._id.toString()) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    const createdVolunteer = await EventVolunteer.create({
      user: args.data.userId,
      event: args.data.eventId,
      group: args.data.groupId,
      creator: context.userId,
      hasAccepted: false,
      isPublic: false,
    });

    await EventVolunteerGroup.findOneAndUpdate(
      {
        _id: args.data.groupId,
      },
      {
        $push: {
          volunteers: createdVolunteer._id,
        },
      },
    );
    return createdVolunteer.toObject();
  };
