import {
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
  USER_NOT_AUTHORIZED,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_PARAM,
} from "../../../constants";
import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { errors, requestContext } from "../../libraries";
import { User, Task, Event } from "../../models";
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

  const task = await Task.findOne({
    _id: args.id,
  }).lean();

  // Checks whether task exists.
  if (!task) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? "Task not found"
        : requestContext.translate("task.notFound"),
      "task.notFound",
      "task"
    );
  }

  // Checks whether currentUser with _id === context.userId is not the creator of task.
  if (task.creator.toString() !== context.userId.toString()) {
    throw new errors.UnauthorizedError(
      IN_PRODUCTION !== true
        ? USER_NOT_AUTHORIZED
        : requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
      USER_NOT_AUTHORIZED_CODE,
      USER_NOT_AUTHORIZED_PARAM
    );
  }

  // Deletes the task.
  await Task.deleteOne({
    _id: task._id,
  });

  // Removes task._id from tasks list of task.event.
  await Event.updateMany(
    {
      _id: task.event,
    },
    {
      $pull: {
        tasks: task._id,
      },
    }
  );

  // Returns deleted task.
  return task;
};
