import { User, EventProject, Event } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  USER_NOT_AUTHORIZED,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_PARAM,
  EVENT_NOT_FOUND,
  EVENT_NOT_FOUND_MESSAGE,
  EVENT_NOT_FOUND_CODE,
  EVENT_NOT_FOUND_PARAM,
} from "../../../constants";
/**
 * This function enables to create an event project.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the event exists
 * 3. If the user is an admin of the event.
 * @returns Created event project
 */
export const createEventProject = async (
  _parent: any,
  args: any,
  context: any
) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  // Checks whether currentUser with _id === context.userId exists.
  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  const event = await Event.findOne({
    _id: args.data.eventId,
  }).lean();

  // Checks whether event exists.
  if (!event) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? EVENT_NOT_FOUND
        : requestContext.translate(EVENT_NOT_FOUND_MESSAGE),
      EVENT_NOT_FOUND_CODE,
      EVENT_NOT_FOUND_PARAM
    );
  }

  const currentUserIsEventAdmin = event.admins.some(
    (admin) => admin.toString() === context.userId.toString()
  );

  // Checks whether currentUser with _id === context.userId is an admin of event.
  if (currentUserIsEventAdmin === false) {
    throw new errors.UnauthorizedError(
      IN_PRODUCTION !== true
        ? USER_NOT_AUTHORIZED
        : requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
      USER_NOT_AUTHORIZED_CODE,
      USER_NOT_AUTHORIZED_PARAM
    );
  }

  // Creates new eventProject.
  const createdEventProject = await EventProject.create({
    title: args.data.title,
    description: args.data.description,
    event: args.data.eventId,
    creator: context.userId,
  });

  // Returns createdEventProject.
  return createdEventProject.toObject();
};
