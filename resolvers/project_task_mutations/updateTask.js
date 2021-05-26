const User = require('../../models/User');
const Task = require('../../models/Task');

const authCheck = require('../functions/authCheck');

const { NotFound, Unauthorized } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');

const updateTask = async (parent, args, context) => {
  authCheck(context);
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFound([
      {
        message: requestContext.translate('user.notFound'),
        code: 'user.notFound',
        param: 'user',
      },
    ]);
  }

  const task = await Task.findOne({ _id: args.id });
  if (!task) {
    throw new NotFound([
      {
        message: requestContext.translate('task.notFound'),
        code: 'task.notFound',
        param: 'task',
      },
    ]);
  }

  if (!(task.creator !== context.userId)) {
    throw new Unauthorized([
      {
        message: requestContext.translate('user.notAuthorized'),
        code: 'user.notAuthorized',
        param: 'userAuthorization',
      },
    ]);
  }

  const newTask = await Task.findOneAndUpdate(
    { _id: args.id },
    { ...args.data },
    { new: true }
  );
  return newTask;
};

module.exports = updateTask;
