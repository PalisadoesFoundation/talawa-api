import {
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  TASK_NOT_FOUND_ERROR,
  TRANSACTION_LOG_TYPES,
} from "../../constants";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Task, TaskVolunteer } from "../../models";
import { storeTransaction } from "../../utilities/storeTransaction";
/**
 * This function enables to remove a task.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the task exists
 * 3. If the user is the creator of the task.
 * @returns Deleted task.
 */
export const removeTask: MutationResolvers["removeTask"] = async (
  _parent,
  args,
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  });

  // Checks whether currentUser with _id === context.userId exists.
  if (currentUser === null) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const task = await Task.findOne({
    _id: args.id,
  }).lean();

  // Checks whether task exists.
  if (!task) {
    throw new errors.NotFoundError(
      requestContext.translate(TASK_NOT_FOUND_ERROR.MESSAGE),
      TASK_NOT_FOUND_ERROR.CODE,
      TASK_NOT_FOUND_ERROR.PARAM
    );
  }

  // Checks whether currentUser with _id === context.userId is not the creator of task.
  if (
    !task.creator.equals(context.userId) &&
    currentUser.userType !== "SUPERADMIN"
  ) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM
    );
  }

  // Deletes the task.
  await Task.deleteOne({
    _id: task._id,
  });
  storeTransaction(
    context.userId,
    TRANSACTION_LOG_TYPES.DELETE,
    "Task",
    `Task:${task._id} deleted`
  );

  await TaskVolunteer.deleteMany({
    taskId: task._id,
  });
  storeTransaction(
    context.userId,
    TRANSACTION_LOG_TYPES.DELETE,
    "TaskVolunteer",
    `TaskVolunteer with taskId in ${task._id} are deleted`
  );

  // Returns deleted task.
  return task;
};
