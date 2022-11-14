import { User, EventProject } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  EVENT_NOT_FOUND_CODE,
  EVENT_PROJECT_NOT_FOUND,
  EVENT_PROJECT_NOT_FOUND_MESSAGE,
  EVENT_PROJECT_NOT_FOUND_PARAM,
  IN_PRODUCTION,
  USER_NOT_AUTHORIZED,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_PARAM,
  USER_NOT_FOUND,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
} from "../../../constants";
/**
 * This function enables to update an event project.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the event project exists.
 * @returns Updated event project.
 */
export const updateEventProject = async (
  _parent: any,
  args: any,
  context: any
) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  const eventProject = await EventProject.findOne({
    _id: args.id,
  }).lean();

  if (!eventProject) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? EVENT_PROJECT_NOT_FOUND
        : requestContext.translate(EVENT_PROJECT_NOT_FOUND_MESSAGE),
      EVENT_NOT_FOUND_CODE,
      EVENT_PROJECT_NOT_FOUND_PARAM
    );
  }

  // toString() method converts mongodb's objectId to a javascript string for comparision
  if (eventProject.creator.toString() !== context.userId.toString()) {
    throw new errors.UnauthorizedError(
      IN_PRODUCTION !== true
        ? USER_NOT_AUTHORIZED
        : requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
      USER_NOT_AUTHORIZED_CODE,
      USER_NOT_AUTHORIZED_PARAM
    );
  }

  return await EventProject.findOneAndUpdate(
    {
      _id: args.id,
    },
    {
      ...args.data,
    },
    {
      new: true,
    }
  ).lean();
};
