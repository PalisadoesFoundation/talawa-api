import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Task, EventProject } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  USER_NOT_FOUND_ERROR,
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  TRANSACTION_LOG_TYPES,
} from "../../constants";
import { storeTransaction } from "../../utilities/storeTransaction";
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
  const currentUser = await User.findOne({
    _id: context.userId,
  });

  // Checks whether currentUser with _id == context.userId exists.
  if (currentUser === null) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const eventProject = await EventProject.findOne({
    _id: args.eventProjectId,
  });

  // Checks whether event with _id == args.eventId exists.
  if (eventProject === null) {
    throw new errors.NotFoundError(
      requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
      EVENT_NOT_FOUND_ERROR.CODE,
      EVENT_NOT_FOUND_ERROR.PARAM
    );
  }

  if (
    eventProject.creator.toString() != currentUser._id.toString() &&
    currentUser.userType !== "SUPERADMIN"
  ) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM
    );
  }
  // Creates new task.
  const createdTask = await Task.create({
    ...args.data,
    eventProjectId: args.eventProjectId,
    creator: context.userId,
  });
  storeTransaction(
    context.userId,
    TRANSACTION_LOG_TYPES.CREATE,
    "Task",
    `Task:${createdTask._id} created`
  );

  // Returns createdTask.
  return createdTask.toObject();
};
