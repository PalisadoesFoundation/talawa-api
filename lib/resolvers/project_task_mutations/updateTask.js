const User = require('../../models/User');
const Task = require('../../models/Task');

const { NotFoundError, UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  NOT_FOUND_USER_MESSAGE,
  NOT_FOUND_USER_CODE,
  NOT_FOUND_USER_PARAM,
  NOT_FOUND_TASK_MESSAGE,
  NOT_FOUND_TASK_CODE,
  NOT_FOUND_TASK_PARAM,
  NOT_AUTHORIZED_USER_CODE,
  NOT_AUTHORIZED_USER_MESSAGE,
  NOT_AUTHORIZED_USER_PARAM,
} = require('../../../constants');

const updateTask = async (parent, args, context) => {
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_USER_MESSAGE),
      NOT_FOUND_USER_CODE,
      NOT_FOUND_USER_PARAM
    );
  }

  const task = await Task.findOne({ _id: args.id });
  if (!task) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_TASK_MESSAGE),
      NOT_FOUND_TASK_CODE,
      NOT_FOUND_TASK_PARAM
    );
  }

  if (!(task.creator !== context.userId)) {
    throw new UnauthorizedError(
      requestContext.translate(NOT_AUTHORIZED_USER_MESSAGE),
      NOT_AUTHORIZED_USER_CODE,
      NOT_AUTHORIZED_USER_PARAM
    );
  }

  const newTask = await Task.findOneAndUpdate(
    { _id: args.id },
    { ...args.data },
    { new: true }
  );
  return newTask;
};

module.exports = updateTask;
