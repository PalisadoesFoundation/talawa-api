import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import type {
  InterfaceEvent,
  InterfaceEventVolunteerGroup,
  InterfaceVolunteerMembership,
} from "../../models";
import {
  Event,
  EventVolunteer,
  EventVolunteerGroup,
  VolunteerMembership,
} from "../../models";
import {
  checkUserExists,
  checkVolunteerMembershipExists,
} from "../../utilities/checks";
import { adminCheck } from "../../utilities";
import { errors, requestContext } from "../../libraries";
import { USER_NOT_AUTHORIZED_ERROR } from "../../constants";

/**
 * Helper function to handle updates when status is accepted
 */
const handleAcceptedStatusUpdates = async (
  membership: InterfaceVolunteerMembership,
): Promise<void> => {
  const updatePromises = [];

  // Always update EventVolunteer to set hasAccepted to true
  updatePromises.push(
    EventVolunteer.findOneAndUpdate(
      { _id: membership.volunteer, event: membership.event },
      {
        $set: { hasAccepted: true },
        ...(membership.group && { $push: { groups: membership.group } }),
      },
    ),
  );

  // Always update Event to add volunteer
  updatePromises.push(
    Event.findOneAndUpdate(
      { _id: membership.event },
      { $addToSet: { volunteers: membership.volunteer } },
    ),
  );

  // If group exists, update the EventVolunteerGroup as well
  if (membership.group) {
    updatePromises.push(
      EventVolunteerGroup.findOneAndUpdate(
        { _id: membership.group },
        { $addToSet: { volunteers: membership.volunteer } },
      ),
    );
  }

  // Execute all updates in parallel
  await Promise.all(updatePromises);
};

/**
 * This function enables to update an Volunteer Membership
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. Whether the user exists
 * 2. Update the Volunteer Membership
 * 3. update related fields of Volunteer Group & Volunteer
 */
export const updateVolunteerMembership: MutationResolvers["updateVolunteerMembership"] =
  async (_parent, args, context) => {
    const currentUser = await checkUserExists(context.userId);
    const volunteerMembership = await checkVolunteerMembershipExists(args.id);

    const event = (await Event.findById(volunteerMembership.event)
      .populate("organization")
      .lean()) as InterfaceEvent;

    if (volunteerMembership.status != "invited") {
      // Check if the user is authorized to update the volunteer membership
      const isAdminOrSuperAdmin = await adminCheck(
        currentUser._id,
        event.organization,
        false,
      );
      const isEventAdmin = event.admins.some(
        (admin) => admin.toString() == currentUser._id.toString(),
      );
      let isGroupLeader = false;
      if (volunteerMembership.group != undefined) {
        // check if current user is group leader
        const group = (await EventVolunteerGroup.findById(
          volunteerMembership.group,
        ).lean()) as InterfaceEventVolunteerGroup;
        isGroupLeader = group.leader.toString() == currentUser._id.toString();
      }

      // If the user is not an admin or super admin, event admin, or group leader, throw an error
      if (!isAdminOrSuperAdmin && !isEventAdmin && !isGroupLeader) {
        throw new errors.UnauthorizedError(
          requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
          USER_NOT_AUTHORIZED_ERROR.CODE,
          USER_NOT_AUTHORIZED_ERROR.PARAM,
        );
      }
    }

    const updatedVolunteerMembership =
      (await VolunteerMembership.findOneAndUpdate(
        {
          _id: args.id,
        },
        {
          $set: {
            status: args.status as
              | "invited"
              | "requested"
              | "accepted"
              | "rejected",
            updatedBy: context.userId,
          },
        },
        {
          new: true,
          runValidators: true,
        },
      ).lean()) as InterfaceVolunteerMembership;

    // Handle additional updates if the status is accepted
    if (args.status === "accepted") {
      await handleAcceptedStatusUpdates(updatedVolunteerMembership);
    }

    return updatedVolunteerMembership;
  };
