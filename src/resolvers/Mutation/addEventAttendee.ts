import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_ALREADY_REGISTERED_FOR_EVENT,
} from "../../constants";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Event, EventAttendee } from "../../models";

export const addEventAttendee: MutationResolvers["addEventAttendee"] = async (
  _parent,
  args,
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  });

  if (currentUser === null) {
    return {
      data: null,
      errors: [
        {
          __typename: "UnauthenticatedError",
          message: USER_NOT_FOUND_ERROR.MESSAGE,
          path: [USER_NOT_FOUND_ERROR.PARAM],
        },
      ],
    };
  }

  const currentEvent = await Event.findOne({
    _id: args.input.eventId,
  }).lean();

  if (currentEvent === null) {
    return {
      data: null,
      errors: [
        {
          __typename: "EventNotFoundError",
          message: EVENT_NOT_FOUND_ERROR.MESSAGE,
          path: [EVENT_NOT_FOUND_ERROR.PARAM],
        },
      ],
    };
  }

  const isUserEventAdmin = currentEvent.admins.some(
    (admin) => admin.toString() === context.userId.toString()
  );

  if (!isUserEventAdmin && currentUser.userType !== "SUPERADMIN") {
    return {
      data: null,
      errors: [
        {
          __typename: "UnauthorizedError",
          message: USER_NOT_AUTHORIZED_ERROR.MESSAGE,
          path: [USER_NOT_AUTHORIZED_ERROR.PARAM],
        },
      ],
    };
  }

  const requestUser = await User.findOne({
    _id: args.input.userId,
  }).lean();

  if (requestUser === null) {
    return {
      data: null,
      errors: [
        {
          __typename: "UserNotFoundError",
          message: USER_NOT_FOUND_ERROR.MESSAGE,
          path: [USER_NOT_FOUND_ERROR.PARAM],
        },
      ],
    };
  }

  const userAlreadyAttendee = await EventAttendee.exists({
    ...args.input,
  });

  if (userAlreadyAttendee) {
    return {
      data: null,
      errors: [
        {
          __typename: "UserAlreadyAttendeeError",
          message: USER_ALREADY_REGISTERED_FOR_EVENT.MESSAGE,
          path: [USER_ALREADY_REGISTERED_FOR_EVENT.PARAM],
        },
      ],
    };
  }

  await EventAttendee.create({ ...args.input });

  return {
    data: requestUser,
    errors: [],
  };
};
