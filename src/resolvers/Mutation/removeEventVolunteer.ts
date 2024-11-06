import {
  EventVolunteer,
  EventVolunteerGroup,
  VolunteerMembership,
} from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import {
  checkEventVolunteerExists,
  checkUserExists,
} from "../../utilities/checks";

/**
 * This function enables to remove an Event Volunteer.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the Event Volunteer exists.
 * 3. Remove the Event Volunteer from their groups and delete the volunteer.
 * 4. Delete the volunteer and their memberships in a single operation.
 * @returns Event Volunteer.
 */

export const removeEventVolunteer: MutationResolvers["removeEventVolunteer"] =
  async (_parent, args, context) => {
    await checkUserExists(context.userId);
    const volunteer = await checkEventVolunteerExists(args.id);

    // Remove volunteer from their groups and delete the volunteer
    const groupIds = volunteer.groups;

    if (groupIds.length > 0) {
      await EventVolunteerGroup.updateMany(
        { _id: { $in: groupIds } },
        { $pull: { volunteers: volunteer._id } },
      );
    }

    // Delete the volunteer and their memberships in a single operation
    await Promise.all([
      EventVolunteer.deleteOne({ _id: volunteer._id }),
      VolunteerMembership.deleteMany({ volunteer: volunteer._id }),
    ]);

    return volunteer;
  };
