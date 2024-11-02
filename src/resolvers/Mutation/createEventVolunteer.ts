import {
  EVENT_NOT_FOUND_ERROR,
  EVENT_VOLUNTEER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { Event, User, VolunteerMembership } from "../../models";
import { EventVolunteer } from "../../models/EventVolunteer";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { adminCheck } from "../../utilities";
import { checkUserExists } from "../../utilities/checks";

/**
 * Creates a new event volunteer entry.
 *
 * This function performs the following actions:
 * 1. Validates the existence of the current user.
 * 2. Checks if the specified user and event exist.
 * 3. Verifies that the current user is an admin of the event.
 * 4. Creates a new volunteer entry for the event.
 * 5. Creates a volunteer membership record for the new volunteer.
 * 6. Returns the created event volunteer record.
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
    const { eventId, userId } = args.data;
    const currentUser = await checkUserExists(context.userId);

    // Check if the volunteer user exists
    const volunteerUser = await User.findById(userId).lean();
    if (!volunteerUser) {
      throw new errors.NotFoundError(
        requestContext.translate(EVENT_VOLUNTEER_NOT_FOUND_ERROR.MESSAGE),
        EVENT_VOLUNTEER_NOT_FOUND_ERROR.CODE,
        EVENT_VOLUNTEER_NOT_FOUND_ERROR.PARAM,
      );
    }
    // Check if the event exists
    const event = await Event.findById(eventId).populate("organization").lean();
    if (!event) {
      throw new errors.NotFoundError(
        requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
        EVENT_NOT_FOUND_ERROR.CODE,
        EVENT_NOT_FOUND_ERROR.PARAM,
      );
    }

    const userIsEventAdmin = event.admins.some(
      (admin) => admin.toString() === currentUser?._id.toString(),
    );

    // Checks creator of the event or admin of the organization
    const isAdmin = await adminCheck(
      currentUser._id,
      event.organization,
      false,
    );
    if (!isAdmin && !userIsEventAdmin) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    // create the volunteer
    const createdVolunteer = await EventVolunteer.create({
      user: userId,
      event: eventId,
      creator: context.userId,
      groups: [],
    });

    // create volunteer membership record
    await VolunteerMembership.create({
      volunteer: createdVolunteer._id,
      event: eventId,
      status: "invited",
      createdBy: context.userId,
    });

    return createdVolunteer.toObject();
  };
