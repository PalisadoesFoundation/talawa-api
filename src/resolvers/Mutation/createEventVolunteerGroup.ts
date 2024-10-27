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
import { checkUserExists } from "../../utilities/checks";

/**
 * Creates a new event volunteer group and associates it with an event.
 *
 * This resolver performs the following actions:
 *
 * 1. Validates the existence of the current user.
 * 2. Checks if the specified event exists.
 * 3. Verifies that the current user is an admin of the event.
 * 4. Creates a new volunteer group for the event.
 * 5. Fetches or creates new volunteers for the group.
 * 6. Creates volunteer group membership records for the new volunteers.
 * 7. Updates the event to include the new volunteer group.
 *
 * @param _parent - The parent object, not used in this resolver.
 * @param args - The input arguments for the mutation, including:
 *   - `data`: An object containing:
 *    - `eventId`: The ID of the event to associate the volunteer group with.
 *    - `name`: The name of the volunteer group.
 *    - `description`: A description of the volunteer group.
 *    - `leaderId`: The ID of the user who will lead the volunteer group.
 *    - `volunteerIds`: An array of user IDs for the volunteers in the group.
 *    - `volunteersRequired`: The number of volunteers required for the group.
 * @param context - The context object containing user information (context.userId).
 *
 * @returns A promise that resolves to the created event volunteer group object.
 *
 * @remarks This function first checks the cache for the current user and then queries the database if needed. It ensures that the user is authorized to create a volunteer group for the event before proceeding.
 */
export const createEventVolunteerGroup: MutationResolvers["createEventVolunteerGroup"] =
  async (_parent, args, context) => {
    const {
      eventId,
      name,
      description,
      leaderId,
      volunteerUserIds,
      volunteersRequired,
    } = args.data;
    // Validate the existence of the current user
    const currentUser = await checkUserExists(context.userId);

    const event = await Event.findById(args.data.eventId)
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

    // Create the new volunteer group
    const createdVolunteerGroup = await EventVolunteerGroup.create({
      creator: context.userId,
      event: eventId,
      leader: leaderId,
      name,
      description,
      volunteers: [],
      volunteersRequired,
    });

    // Fetch Volunteers or Create New Ones if Necessary
    const volunteers = await EventVolunteer.find({
      user: { $in: volunteerUserIds },
      event: eventId,
    }).lean();

    const existingVolunteerIds = volunteers.map((vol) => vol.user.toString());
    const newVolunteerUserIds = volunteerUserIds.filter(
      (id) => !existingVolunteerIds.includes(id),
    );

    // Bulk Create New Volunteers if Needed
    const newVolunteers = await EventVolunteer.insertMany(
      newVolunteerUserIds.map((userId) => ({
        user: userId,
        event: eventId,
        creator: context.userId,
        groups: [],
      })),
    );

    const allVolunteerIds = [
      ...volunteers.map((v) => v._id.toString()),
      ...newVolunteers.map((v) => v._id.toString()),
    ];

    // Bulk Create VolunteerMembership Records
    await VolunteerMembership.insertMany(
      allVolunteerIds.map((volunteerId) => ({
        volunteer: volunteerId,
        group: createdVolunteerGroup._id,
        event: eventId,
        status: "invited",
        createdBy: context.userId,
      })),
    );

    await Event.findByIdAndUpdate(eventId, {
      $push: { volunteerGroups: createdVolunteerGroup._id },
    });

    return createdVolunteerGroup.toObject();
  };
