const User = require('../../models/User');
const Task = require('../../models/Task');

const { NotFoundError, UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');

const updateTask = async (parent, args, context) => {
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  const task = await Task.findOne({ _id: args.id });
  if (!task) {
    throw new NotFoundError(
      requestContext.translate('task.notFound'),
      'task.notFound',
      'task'
    );
  }

  if (!(task.creator !== context.userId)) {
    throw new UnauthorizedError(
      requestContext.translate('user.notAuthorized'),
      'user.notAuthorized',
      'userAuthorization'
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
