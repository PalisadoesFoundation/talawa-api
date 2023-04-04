import { Types } from "mongoose";
import { TASK_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";
import { Task } from "../../models";

/**
 * Throws error if there exists no `Task`a with the given `id` else returns matching `Task` document
 * @param taskId - `id` of the desried task
 */
export const getValidTaskById = async (taskId: string | Types.ObjectId) => {
  const task = await Task.findOne({
    _id: taskId,
  }).lean();

  if (!task) {
    throw new errors.NotFoundError(
      requestContext.translate(TASK_NOT_FOUND_ERROR.MESSAGE),
      TASK_NOT_FOUND_ERROR.CODE,
      TASK_NOT_FOUND_ERROR.PARAM
    );
  }

  return task;
};
