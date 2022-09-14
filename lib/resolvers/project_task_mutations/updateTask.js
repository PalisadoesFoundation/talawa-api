const User = require('../../models/User');
// const Task = require('../../models/Task');
const { tenantCtx } = require('../../helper_functions');

const { NotFoundError, UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');

const updateTask = async (parent, args, context) => {
  const { id, db } = await tenantCtx(args.id);
  const { Task } = db;
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  const task = await Task.findOne({ _id: id });
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
    { _id: id },
    { ...args.data },
    { new: true }
  );
  newTask._doc._id = args.id;
  return newTask;
};

module.exports = updateTask;
