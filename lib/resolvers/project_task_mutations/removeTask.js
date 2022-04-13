const User = require('../../models/User');
const Event = require('../../models/Event');
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

const removeTask = async (parent, args, context) => {
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_USER_MESSAGE),
      NOT_FOUND_USER_CODE,
      NOT_FOUND_USER_PARAM
    );
  }

  const foundTask = await Task.findOne({ _id: args.id });
  if (!foundTask) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_TASK_MESSAGE),
      NOT_FOUND_TASK_CODE,
      NOT_FOUND_TASK_PARAM
    );
  }

  if (!(foundTask.creator !== context.userId)) {
    throw new UnauthorizedError(
      requestContext.translate(NOT_AUTHORIZED_USER_MESSAGE),
      NOT_AUTHORIZED_USER_CODE,
      NOT_AUTHORIZED_USER_PARAM
    );
  }

  await Event.updateMany(
    { id: foundTask.event },
    {
      $pull: {
        tasks: args.id,
      },
    }
  );

  await Task.deleteOne({ _id: args.id });
  return foundTask;
};

module.exports = removeTask;
