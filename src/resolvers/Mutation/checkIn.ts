import { Types } from "mongoose";
import {
  EVENT_NOT_FOUND_ERROR,
  USER_ALREADY_CHECKED_IN,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceEvent } from "../../models";
import {
  AppUserProfile,
  CheckIn,
  Event,
  EventAttendee,
  User,
} from "../../models";
import { findEventsInCache } from "../../services/EventCache/findEventInCache";
import { cacheEvents } from "../../services/EventCache/cacheEvents";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Handles the check-in process for event attendees.
 * 
 * This resolver function allows event admins or superadmins to check-in attendees for a specific event.
 * It verifies the existence of the current user, the event, and the attendee to be checked in,
 * and ensures proper authorization before performing the check-in operation.
 * 
 * @param _parent - The parent resolver.
 * @param args - Arguments containing data for the check-in, including the eventId, userId, allotedSeat, and allotedRoom.
 * @param context - Context object containing user authentication and request information.
 * @returns The check-in data if successful.
 * @throws NotFoundError if the current user, event, or attendee is not found.
 * @throws UnauthorizedError if the current user lacks authorization to perform the check-in operation.
 * @throws ConflictError if the attendee is already checked in for the event.
 * @remarks
 * The function performs the following checks and operations:
 * 1. Verifies the existence of the current user, event, and attendee.
 * 2. Checks if the current user is authorized to perform the check-in operation.
 * 3. Checks if the attendee is already registered for the event. If so, updates the check-in status and isCheckedIn.
 * 4. Checks if the attendee is not already checked in for the event then creates a new check-in entry and create new eventAttendee with chechInId and isCheckedIn.

 */

/**
 * Handles the check-in process for event attendees.
 * 
 * This resolver function allows event admins or superadmins to check-in attendees for a specific event.
 * It verifies the existence of the current user, the event, and the attendee to be checked in,
 * and ensures proper authorization before performing the check-in operation.
 * 
 * @param _parent - The parent resolver.
 * @param args - Arguments containing data for the check-in, including the eventId, userId, allotedSeat, and allotedRoom.
 * @param context - Context object containing user authentication and request information.
 * @returns The check-in data if successful.
 * @throws NotFoundError if the current user, event, or attendee is not found.
 * @throws UnauthorizedError if the current user lacks authorization to perform the check-in operation.
 * @throws ConflictError if the attendee is already checked in for the event.
 * @remarks
 * The function performs the following checks and operations:
 * 1. Verifies the existence of the current user, event, and attendee.
 * 2. Checks if the current user is authorized to perform the check-in operation.
 * 3. Checks if the attendee is already registered for the event. If so, updates the check-in status and isCheckedIn.
 * 4. Checks if the attendee is not already checked in for the event then creates a new check-in entry and create new eventAttendee with chechInId and isCheckedIn.

 */

export const checkIn: MutationResolvers["checkIn"] = async (
  _parent,
  args,
  context,
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  });

  if (currentUser === null) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }
  const currentUserAppProfile = await AppUserProfile.findOne({
    userId: currentUser._id,
  }).lean();
  if (!currentUserAppProfile) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }
  let currentEvent: InterfaceEvent | null;

  const eventFoundInCache = await findEventsInCache([args.data.eventId]);

  currentEvent = eventFoundInCache[0];

  if (eventFoundInCache[0] === null) {
    currentEvent = await Event.findOne({
      _id: args.data.eventId,
    }).lean();

    if (currentEvent !== null) {
      await cacheEvents([currentEvent]);
    }
  }

  if (currentEvent === null) {
    throw new errors.NotFoundError(
      requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
      EVENT_NOT_FOUND_ERROR.CODE,
      EVENT_NOT_FOUND_ERROR.PARAM,
    );
  }

  const isUserEventAdmin = currentEvent.admins.some(
    (admin) =>
      admin === context.userID ||
      new Types.ObjectId(admin).equals(context.userId),
  );

  if (!isUserEventAdmin && currentUserAppProfile.isSuperAdmin === false) {
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

  const attendeeData = await EventAttendee.findOne({
    eventId: args.data.eventId,
    userId: args.data.userId,
  });

  if (attendeeData === null) {
    const checkInAttendee = await EventAttendee.create({
      eventId: args.data.eventId,
      userId: args.data.userId,
    });

    const checkIn = await CheckIn.create({
      eventAttendeeId: checkInAttendee._id,
    });

    checkInAttendee.checkInId = checkIn._id;
    checkInAttendee.save();

    return checkIn.toObject();
  }

  if (attendeeData.isCheckedIn) {
    throw new errors.ConflictError(
      requestContext.translate(USER_ALREADY_CHECKED_IN.MESSAGE),
      USER_ALREADY_CHECKED_IN.CODE,
      USER_ALREADY_CHECKED_IN.PARAM,
    );
  }
  const checkIn = await CheckIn.create({
    eventAttendeeId: attendeeData._id,
  });

  await EventAttendee.updateOne(
    {
      eventId: args.data.eventId,
      userId: args.data.userId,
    },
    {
      checkInId: checkIn._id,
    },
  );
  // attendeeData.isCheckedIn = true;
  // attendeeData.checkInId = checkIn._id;
  // await attendeeData.save();

  return checkIn.toObject();
};
