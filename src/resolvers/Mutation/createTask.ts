import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Task, EventProject } from "../../models";
import { errors, requestContext } from "../../libraries";
import { USER_NOT_FOUND_ERROR, EVENT_NOT_FOUND_ERROR } from "../../constants";
/**
 * This function enables to create a task.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the event exists
 * @returns Created task
 */

export const createTask: MutationResolvers["createTask"] = async (
  _parent,
  args,
  context
) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  // Checks whether currentUser with _id == context.userId exists.
  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const eventProjectExists = await EventProject.exists({
    _id: args.eventProjectId,
  });

  // Checks whether event with _id == args.eventId exists.
  if (eventProjectExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
      EVENT_NOT_FOUND_ERROR.CODE,
      EVENT_NOT_FOUND_ERROR.PARAM
    );
  }

  // Creates new task.
  const createdTask = await Task.create({
    ...args.data,
    eventProjectId: args.eventProjectId,
    creator: context.userId,
  });

  // Returns createdTask.
  return createdTask.toObject();
};
