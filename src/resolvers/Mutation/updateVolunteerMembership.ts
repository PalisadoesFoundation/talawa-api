import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceVolunteerMembership } from "../../models";
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
    await checkUserExists(context.userId);
    await checkVolunteerMembershipExists(args.id);
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
