import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import {
  Event,
  EventVolunteer,
  EventVolunteerGroup,
  VolunteerMembership,
} from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { adminCheck } from "../../utilities";
import {
  checkUserExists,
  checkVolunteerGroupExists,
} from "../../utilities/checks";

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
    const currentUser = await checkUserExists(context.userId);
    const volunteerGroup = await checkVolunteerGroupExists(args.id);

    const event = await Event.findById(volunteerGroup.event)
      .populate("organization")
      .lean();
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

    const isAdmin = await adminCheck(
      currentUser._id,
      event.organization,
      false,
    );
    // Checks if user is Event Admin or Admin of the organization
    if (!isAdmin && !userIsEventAdmin) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    await Promise.all([
      // Remove the volunteer group
      EventVolunteerGroup.deleteOne({ _id: args.id }),

      // Remove the group from volunteers
      EventVolunteer.updateMany(
        { groups: { $in: args.id } },
        { $pull: { groups: args.id } },
      ),

      // Delete all associated volunteer group memberships
      VolunteerMembership.deleteMany({ group: args.id }),

      // Remove the group from the event
      Event.updateOne(
        { _id: volunteerGroup.event },
        { $pull: { volunteerGroups: args.id } },
      ),
    ]);

    return volunteerGroup;
  };
