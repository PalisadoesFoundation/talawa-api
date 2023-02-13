import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Event } from "../../models";
import {
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  EVENT_NOT_FOUND_MESSAGE,
  EVENT_NOT_FOUND_CODE,
  EVENT_NOT_FOUND_PARAM,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_PARAM,
} from "../../constants";

export const updateEvent: MutationResolvers["updateEvent"] = async (
  _parent,
  args,
  context
) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  // checks if current user exists
  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  const event = await Event.findOne({
    _id: args.id,
  }).lean();

  // checks if there exists an event with _id === args.id
  if (!event) {
    throw new errors.NotFoundError(
      requestContext.translate(EVENT_NOT_FOUND_MESSAGE),
      EVENT_NOT_FOUND_CODE,
      EVENT_NOT_FOUND_PARAM
    );
  }

  const currentUserIsEventAdmin = event.admins.some(
    (admin) => admin.toString() === context.userId.toString()
  );

  // checks if current user is an admin of the event with _id === args.id
  if (currentUserIsEventAdmin === false) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
      USER_NOT_AUTHORIZED_CODE,
      USER_NOT_AUTHORIZED_PARAM
    );
  }

  return await Event.findOneAndUpdate(
    {
      _id: args.id,
    },
    // @ts-ignore
    {
      ...args.data,
    },
    {
      new: true,
    }
  ).lean();
};
