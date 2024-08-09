import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_REGISTERED_FOR_EVENT,
} from "../../constants";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import type {
  InterfaceAppUserProfile,
  InterfaceEvent,
  InterfaceUser,
} from "../../models";
import { User, Event, EventAttendee, AppUserProfile } from "../../models";
import { findEventsInCache } from "../../services/EventCache/findEventInCache";
import { cacheEvents } from "../../services/EventCache/cacheEvents";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";

/**
 * Removes a user from the list of attendees for a specific event.
 *
 * This function manages the removal of an event attendee by first verifying
 * the current user's authorization and the existence of the event. It checks
 * if the user making the request is either a super admin or an admin of the event,
 * and if the user to be removed is indeed registered as an attendee for the event.
 * If all checks pass, the user is removed from the event's attendee list.
 *
 * @param _parent - This is an unused parameter representing the parent resolver in the GraphQL schema. It can be ignored.
 * @param args - Contains the arguments passed to the GraphQL mutation, specifically the event ID and user ID of the attendee to be removed.
 * @param context - Provides contextual information, including the current user's ID. This is used to authenticate and authorize the request.
 *
 * @returns The details of the removed user if the removal was successful.
 *
 */
export const removeEventAttendee: MutationResolvers["removeEventAttendee"] =
  async (_parent, args, context) => {
    // Tries to find the current user in the cache using the user's ID from the context.
    let currentUser: InterfaceUser | null;
    const userFoundInCache = await findUserInCache([context.userId]);
    currentUser = userFoundInCache[0];

    // If the user is not found in the cache, tries to find them in the database.
    if (currentUser === null) {
      currentUser = await User.findOne({
        _id: context.userId,
      }).lean();

      // If the user is found in the database, they are cached for future requests.
      if (currentUser !== null) {
        await cacheUsers([currentUser]);
      }
    }

    // If the user is still not found, throws an error indicating the user does not exist.
    if (currentUser === null) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Tries to find the current user's app profile in the cache.
    let currentUserAppProfile: InterfaceAppUserProfile | null;
    const appUserProfileFoundInCache = await findAppUserProfileCache([
      currentUser.appUserProfileId?.toString(),
    ]);
    currentUserAppProfile = appUserProfileFoundInCache[0];

    // If the app profile is not found in the cache, tries to find it in the database.
    if (currentUserAppProfile === null) {
      currentUserAppProfile = await AppUserProfile.findOne({
        userId: currentUser._id,
      }).lean();

      // If the profile is found in the database, it is cached for future requests.
      if (currentUserAppProfile !== null) {
        await cacheAppUserProfile([currentUserAppProfile]);
      }
    }

    // If the user's app profile is not found, throws an error indicating the user is unauthorized.
    if (!currentUserAppProfile) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    // Tries to find the event in the cache.
    let currentEvent: InterfaceEvent | null;
    const eventFoundInCache = await findEventsInCache([args.data.eventId]);
    currentEvent = eventFoundInCache[0];

    // If the event is not found in the cache, tries to find it in the database.
    if (eventFoundInCache[0] === null) {
      currentEvent = await Event.findOne({
        _id: args.data.eventId,
      }).lean();

      // If the event is found in the database, it is cached for future requests.
      if (currentEvent !== null) {
        await cacheEvents([currentEvent]);
      }
    }

    // If the event is not found, throws an error indicating the event does not exist.
    if (currentEvent === null) {
      throw new errors.NotFoundError(
        requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
        EVENT_NOT_FOUND_ERROR.CODE,
        EVENT_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Checks if the current user is an admin for the event or a super admin.
    const isUserEventAdmin = currentEvent.admins.some(
      (admin) => admin.toString() === context.userId.toString(),
    );

    // If the user is not an event admin or a super admin, throws an error indicating they are unauthorized.
    if (!isUserEventAdmin && currentUserAppProfile.isSuperAdmin === false) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    // Tries to find the user who is to be removed as an attendee.
    const requestUser = await User.findOne({
      _id: args.data.userId,
    }).lean();

    // If the user to be removed is not found, throws an error indicating the user does not exist.
    if (requestUser === null) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Checks if the user is already an attendee of the event.
    const userAlreadyAttendee = await EventAttendee.exists({
      ...args.data,
    });

    // If the user is not registered as an attendee, throws an error indicating the conflict.
    if (!userAlreadyAttendee) {
      throw new errors.ConflictError(
        requestContext.translate(USER_NOT_REGISTERED_FOR_EVENT.MESSAGE),
        USER_NOT_REGISTERED_FOR_EVENT.CODE,
        USER_NOT_REGISTERED_FOR_EVENT.PARAM,
      );
    }

    // Removes the user from the list of attendees.
    await EventAttendee.deleteOne({ ...args.data });

    // Returns the details of the removed user.
    return requestUser;
  };
