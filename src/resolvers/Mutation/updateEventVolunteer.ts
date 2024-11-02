import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { EVENT_VOLUNTEER_INVITE_USER_MISTMATCH } from "../../constants";
import type { InterfaceEventVolunteer } from "../../models";
import { EventVolunteer } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  checkEventVolunteerExists,
  checkUserExists,
} from "../../utilities/checks";
/**
 * This function enables to update an Event Volunteer
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. Whether the user exists
 * 2. Whether the EventVolunteer exists
 * 3. Whether the current user is the user of EventVolunteer
 * 4. Update the EventVolunteer
 */
export const updateEventVolunteer: MutationResolvers["updateEventVolunteer"] =
  async (_parent, args, context) => {
    await checkUserExists(context.userId);
    const volunteer = await checkEventVolunteerExists(args.id);

    if (volunteer.user.toString() !== context.userId.toString()) {
      throw new errors.ConflictError(
        requestContext.translate(EVENT_VOLUNTEER_INVITE_USER_MISTMATCH.MESSAGE),
        EVENT_VOLUNTEER_INVITE_USER_MISTMATCH.CODE,
        EVENT_VOLUNTEER_INVITE_USER_MISTMATCH.PARAM,
      );
    }

    const updatedVolunteer = await EventVolunteer.findOneAndUpdate(
      {
        _id: args.id,
      },
      {
        $set: {
          assignments:
            args.data?.assignments === undefined
              ? volunteer.assignments
              : (args.data?.assignments as string[]),
          hasAccepted:
            args.data?.hasAccepted === undefined
              ? volunteer.hasAccepted
              : (args.data?.hasAccepted as boolean),
          isPublic:
            args.data?.isPublic === undefined
              ? volunteer.isPublic
              : (args.data?.isPublic as boolean),
        },
      },
      {
        new: true,
        runValidators: true,
      },
    ).lean();

    return updatedVolunteer as InterfaceEventVolunteer;
  };
