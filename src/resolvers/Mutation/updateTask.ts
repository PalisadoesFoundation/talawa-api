import {
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_PARAM,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
} from "../../constants";
import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Task } from "../../models";

export const updateTask: MutationResolvers["updateTask"] = async (
  _parent,
  args,
  context
) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  const task = await Task.findOne({
    _id: args.id,
  }).lean();

  if (!task) {
    throw new errors.NotFoundError(
      requestContext.translate("task.notFound"),
      "task.notFound",
      "task"
    );
  }

  if (task.creator.toString() !== context.userId.toString()) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
      USER_NOT_AUTHORIZED_CODE,
      USER_NOT_AUTHORIZED_PARAM
    );
  }

  // @ts-ignore
  const updatedTask = await Task.findOneAndUpdate(
    {
      _id: task._id,
    },
    {
      ...args,
    },
    {
      new: true,
    }
  ).lean();

  return updatedTask;
};
