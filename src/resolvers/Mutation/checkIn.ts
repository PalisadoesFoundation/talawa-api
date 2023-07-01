import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_REGISTERED_FOR_EVENT,
  USER_ALREADY_CHECKED_IN,
} from "../../constants";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Event, EventAttendee, CheckIn } from "../../models";

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

  const currentEvent = await Event.findOne({
    _id: args.data.eventId,
  }).lean();

  if (currentEvent === null) {
    throw new errors.NotFoundError(
      requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
      EVENT_NOT_FOUND_ERROR.CODE,
      EVENT_NOT_FOUND_ERROR.PARAM
    );
  }

  const isUserEventAdmin = currentEvent.admins.some(
    (admin) => admin.toString() === context.userId.toString()
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

  await EventAttendee.updateOne(
    {
      eventId: args.data.eventId,
      userId: args.data.userId,
    },
    {
      checkInId: checkIn._id,
    }
  );

  return checkIn.toObject();
};
