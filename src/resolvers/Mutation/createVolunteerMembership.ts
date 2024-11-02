import { EVENT_NOT_FOUND_ERROR, USER_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";
import { Event, User, VolunteerMembership } from "../../models";
import { EventVolunteer } from "../../models/EventVolunteer";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { checkUserExists } from "../../utilities/checks";

/**
 * Creates a new event volunteer membership entry.
 *
 * This function performs the following actions:
 * 1. Validates the existence of the current user.
 * 2. Checks if the specified user and event exist.
 * 3. Creates a new volunteer entry for the event.
 * 4. Creates a volunteer membership record for the new volunteer.
 * 5. Returns the created vvolunteer membership record.
 *
 * @param _parent - The parent object for the mutation. This parameter is not used in this resolver.
 * @param args - The arguments for the mutation, including:
 *  - `data.userId`: The ID of the user to be assigned as a volunteer.
 *  - `data.event`: The ID of the event for which the volunteer is being created.
 *  - `data.group`: The ID of the volunteer group to which the user is being added.
 *  - `data.status`: The status of the volunteer membership.
 *
 * @param context - The context for the mutation, including:
 *   - `userId`: The ID of the current user performing the operation.
 *
 * @returns The created event volunteer record.
 *
 */
export const createVolunteerMembership: MutationResolvers["createVolunteerMembership"] =
  async (_parent, args, context) => {
    const { event: eventId, status, group, userId } = args.data;
    await checkUserExists(context.userId);

    // Check if the volunteer user exists
    const volunteerUser = await User.findById(userId).lean();
    if (!volunteerUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
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

    // check if event volunteer exists
    let eventVolunteer = await EventVolunteer.findOne({
      user: userId,
      event: eventId,
    }).lean();

    if (!eventVolunteer) {
      // create the volunteer
      eventVolunteer = await EventVolunteer.create({
        user: userId,
        event: eventId,
        creator: context.userId,
        groups: [],
      });
    }

    // create volunteer membership record
    const membership = await VolunteerMembership.create({
      volunteer: eventVolunteer._id,
      event: eventId,
      status: status,
      ...(group && { group }),
      createdBy: context.userId,
    });

    return membership.toObject();
  };
