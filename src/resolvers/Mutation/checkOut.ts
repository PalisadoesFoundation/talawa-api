import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  ATTENDEE_NOT_FOUND,
  USER_NOT_CHECKED_IN,
  USER_ALREADY_CHECKED_OUT,
} from "../../constants";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import type { InterfaceEvent } from "../../models";
import { User, Event, EventAttendee, CheckOut } from "../../models";
import { findEventsInCache } from "../../services/EventCache/findEventInCache";
import { cacheEvents } from "../../services/EventCache/cacheEvents";
import { Types } from "mongoose";

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

export const checkOut: MutationResolvers["checkOut"] = async (
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
      admin === context.userID || Types.ObjectId(admin).equals(context.userId),
  );

  if (!isUserEventAdmin && currentUser.userType !== "SUPERADMIN") {
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
    throw new errors.NotFoundError(
      requestContext.translate(ATTENDEE_NOT_FOUND.MESSAGE),
      ATTENDEE_NOT_FOUND.CODE,
      ATTENDEE_NOT_FOUND.PARAM,
    );
  }

  if (attendeeData.isCheckedIn === null) {
    throw new errors.ConflictError(
      requestContext.translate(USER_NOT_CHECKED_IN.MESSAGE),
      USER_NOT_CHECKED_IN.CODE,
      USER_NOT_CHECKED_IN.PARAM,
    );
  }

  if (attendeeData.isCheckedOut) {
    throw new errors.ConflictError(
      requestContext.translate(USER_ALREADY_CHECKED_OUT.MESSAGE),
      USER_ALREADY_CHECKED_OUT.CODE,
      USER_ALREADY_CHECKED_OUT.PARAM,
    );
  }

  const checkOut = await CheckOut.create({
    eventAttendeeId: attendeeData._id,
  });

  await EventAttendee.updateOne(
    {
      eventId: args.data.eventId,
      userId: currentEvent,
    },
    {
      checkInId: checkOut._id,
    },
  );

  return checkOut.toObject() as any;
};
