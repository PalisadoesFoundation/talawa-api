import mongoose from "mongoose";
import {
  EVENT_NOT_FOUND_ERROR,
  USER_ALREADY_REGISTERED_FOR_EVENT,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_MEMBER_FOR_ORGANIZATION,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type {
  InterfaceAppUserProfile,
  InterfaceEvent,
  InterfaceUser,
} from "../../models";
import { AppUserProfile, Event, EventAttendee, User } from "../../models";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheEvents } from "../../services/EventCache/cacheEvents";
import { findEventsInCache } from "../../services/EventCache/findEventInCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Mutation resolver function to add a user as an attendee to an event.
 *
 * This function performs the following actions:
 * 1. Retrieves the current user from the cache or database.
 * 2. Retrieves the current user's app profile from the cache or database.
 * 3. Retrieves the event from the cache or database.
 * 4. Checks if the user making the request is an admin of the event or a super admin.
 * 5. Validates that the user to be added as an attendee exists and is not already registered for the event.
 * 6. Checks if the user to be added is a member of the organization hosting the event.
 * 7. Adds the user as an attendee to the event if all checks pass.
 *
 * @param _parent - The parent object for the mutation. Typically, this is not used in this resolver.
 * @param args - The arguments for the mutation, including:
 *   - `data.eventId`: The ID of the event to which the user will be added as an attendee.
 *   - `data.userId`: The ID of the user to be added as an attendee.
 * @param context - The context for the mutation, including:
 *   - `userId`: The ID of the current user making the request.
 *
 * @returns A promise that resolves to the user document representing the user added as an attendee.
 *
 * @see User - The User model used to interact with the users collection in the database.
 * @see AppUserProfile - The AppUserProfile model used to interact with the app user profiles collection in the database.
 * @see Event - The Event model used to interact with the events collection in the database.
 * @see EventAttendee - The EventAttendee model used to manage event attendee registrations.
 * @see MutationResolvers - The type definition for the mutation resolvers.
 */
export const addEventAttendee: MutationResolvers["addEventAttendee"] = async (
  _parent,
  args,
  context,
) => {
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
  if (currentUser === null) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }
  let currentUserAppProfile: InterfaceAppUserProfile | null;
  const appUserProfileFoundInCache = await findAppUserProfileCache([
    currentUser.appUserProfileId,
  ]);
  currentUserAppProfile = appUserProfileFoundInCache[0];
  if (currentUserAppProfile === null) {
    currentUserAppProfile = await AppUserProfile.findOne({
      userId: currentUser._id,
    }).lean();
    if (currentUserAppProfile !== null) {
      await cacheAppUserProfile([currentUserAppProfile]);
    }
  }

  if (!currentUserAppProfile) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  let event: InterfaceEvent | null;
  const eventFoundInCache = await findEventsInCache([args.data.eventId]);

  event = eventFoundInCache[0];

  if (eventFoundInCache[0] === null) {
    event = await Event.findOne({
      _id: args.data.eventId,
    }).lean();

    if (event !== null) {
      await cacheEvents([event]);
    }
  }

  if (event === null) {
    throw new errors.NotFoundError(
      requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
      EVENT_NOT_FOUND_ERROR.CODE,
      EVENT_NOT_FOUND_ERROR.PARAM,
    );
  }

  const isUserEventAdmin = event.admins.some(
    (admin) =>
      admin === context.userID ||
      new mongoose.Types.ObjectId(admin.toString()).equals(context.userId),
  );

  if (!isUserEventAdmin && !currentUserAppProfile.isSuperAdmin) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  const requestUser = await User.findOne({
    _id: args.data.userId,
  }).lean();

  if (requestUser === null) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  const userAlreadyAttendee = await EventAttendee.exists({
    ...args.data,
  });

  if (userAlreadyAttendee) {
    throw new errors.ConflictError(
      requestContext.translate(USER_ALREADY_REGISTERED_FOR_EVENT.MESSAGE),
      USER_ALREADY_REGISTERED_FOR_EVENT.CODE,
      USER_ALREADY_REGISTERED_FOR_EVENT.PARAM,
    );
  }
  const eventOrgId = event.organization._id.toString();

  const joinedOrgs = requestUser.joinedOrganizations.map((org) =>
    org.toString(),
  );

  const requestUserIsOrganizationMember = joinedOrgs.includes(eventOrgId);

  if (!requestUserIsOrganizationMember) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_MEMBER_FOR_ORGANIZATION.MESSAGE),
      USER_NOT_MEMBER_FOR_ORGANIZATION.CODE,
      USER_NOT_MEMBER_FOR_ORGANIZATION.PARAM,
    );
  }

  await EventAttendee.create({ ...args.data });

  const updatedUser = await User.findByIdAndUpdate(
    args.data.userId,
    {
      $push: {
        eventsAttended: args.data.eventId,
      },
    },
    { new: true },
  );
  /*istanbul ignore next*/
  if (!updatedUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  return updatedUser;
};
