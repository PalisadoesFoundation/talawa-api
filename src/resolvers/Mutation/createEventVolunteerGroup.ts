import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceUser } from "../../models";
import { Event, EventVolunteerGroup, User } from "../../models";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Creates a new event volunteer group and associates it with an event.
 *
 * This resolver performs the following actions:
 *
 * 1. Validates the existence of the current user.
 * 2. Checks if the specified event exists.
 * 3. Verifies that the current user is an admin of the event.
 * 4. Creates a new volunteer group for the event.
 * 5. Updates the event to include the newly created volunteer group.
 *
 * @param _parent - The parent object, not used in this resolver.
 * @param args - The input arguments for the mutation, including:
 *   - `data`: An object containing:
 *     - `eventId`: The ID of the event to associate the volunteer group with.
 *     - `name`: The name of the volunteer group.
 *     - `volunteersRequired`: The number of volunteers required for the group.
 * @param context - The context object containing user information (context.userId).
 *
 * @returns A promise that resolves to the created event volunteer group object.
 *
 * @remarks This function first checks the cache for the current user and then queries the database if needed. It ensures that the user is authorized to create a volunteer group for the event before proceeding.
 */
export const createEventVolunteerGroup: MutationResolvers["createEventVolunteerGroup"] =
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
    const event = await Event.findById(args.data.eventId);
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

    if (!userIsEventAdmin) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    const createdVolunteerGroup = await EventVolunteerGroup.create({
      event: args.data.eventId,
      creator: context.userId,
      leader: context.userId,
      name: args.data.name,
      volunteersRequired: args.data?.volunteersRequired,
    });

    await Event.findOneAndUpdate(
      {
        _id: args.data.eventId,
      },
      {
        $push: {
          volunteerGroups: createdVolunteerGroup._id,
        },
      },
    );

    return createdVolunteerGroup.toObject();
  };
