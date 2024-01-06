import {
  TASK_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Task } from "../../models";
/**
 * This function enables to update a task.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the task exists.
 * @returns Updated task.
 */
export const updateTask: MutationResolvers["updateTask"] = async (
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

  const task = await Task.findOne({
    _id: args.id,
  }).lean();

  if (!task) {
    throw new errors.NotFoundError(
      requestContext.translate(TASK_NOT_FOUND_ERROR.MESSAGE),
      TASK_NOT_FOUND_ERROR.CODE,
      TASK_NOT_FOUND_ERROR.PARAM
    );
  }

  if (
    task.createdBy.toString() !== context.userId.toString() &&
    currentUser.userType !== "SUPERADMIN"
  ) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM
    );
  }

  const updatedTask = await Task.findOneAndUpdate(
    {
      _id: args.id,
    },
    {
      ...(args.data as any),
    },
    {
      new: true,
    }
  ).lean();

  return updatedTask;
};
