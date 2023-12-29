import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_REGISTERED_FOR_EVENT,
  USER_ALREADY_CHECKED_IN,
  TRANSACTION_LOG_TYPES,
} from "../../constants";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import type { InterfaceEvent } from "../../models";
import { User, Event, EventAttendee, CheckIn } from "../../models";
import { findEventsInCache } from "../../services/EventCache/findEventInCache";
import { cacheEvents } from "../../services/EventCache/cacheEvents";
import { Types } from "mongoose";
import { storeTransaction } from "../../utilities/storeTransaction";

export const checkIn: MutationResolvers["checkIn"] = async (
  _parent,
  args,
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  });

  if (currentUser === null) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
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
      EVENT_NOT_FOUND_ERROR.PARAM
    );
  }

  const isUserEventAdmin = currentEvent.admins.some(
    (admin) =>
      admin === context.userID || Types.ObjectId(admin).equals(context.userId)
  );

  if (!isUserEventAdmin && currentUser.userType !== "SUPERADMIN") {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM
    );
  }

  const requestUser = await User.findOne({
    _id: args.data.userId,
  }).lean();

  if (requestUser === null) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const attendeeData = await EventAttendee.findOne({
    eventId: args.data.eventId,
    userId: args.data.userId,
  });

  if (attendeeData === null) {
    throw new errors.ConflictError(
      requestContext.translate(USER_NOT_REGISTERED_FOR_EVENT.MESSAGE),
      USER_NOT_REGISTERED_FOR_EVENT.CODE,
      USER_NOT_REGISTERED_FOR_EVENT.PARAM
    );
  }

  if (attendeeData.checkInId !== null) {
    throw new errors.ConflictError(
      requestContext.translate(USER_ALREADY_CHECKED_IN.MESSAGE),
      USER_ALREADY_CHECKED_IN.CODE,
      USER_ALREADY_CHECKED_IN.PARAM
    );
  }

  const checkIn = await CheckIn.create({
    eventAttendeeId: attendeeData!._id,
    allotedSeat: args.data.allotedSeat,
    allotedRoom: args.data.allotedRoom,
  });
  storeTransaction(
    context.userId,
    TRANSACTION_LOG_TYPES.CREATE,
    "CheckIn",
    `CheckIn:${checkIn._id} created`
  );

  const updatedEventAttendee = await EventAttendee.findOneAndUpdate(
    {
      eventId: args.data.eventId,
      userId: args.data.userId,
    },
    {
      checkInId: checkIn._id,
    },
    {
      new: true,
    }
  );
  storeTransaction(
    context.userId,
    TRANSACTION_LOG_TYPES.UPDATE,
    "EventAttendee",
    `EventAttendee:${updatedEventAttendee?._id} updated checkInId`
  );

  return checkIn.toObject();
};
