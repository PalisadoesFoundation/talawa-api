const User = require('../../models/User');
const Event = require('../../models/Event');
const Task = require('../../models/Task');
const { NotFoundError, UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');

const removeTask = async (parent, args, context) => {
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  const foundTask = await Task.findOne({ _id: args.id });
  if (!foundTask) {
    throw new NotFoundError(
      requestContext.translate('task.notFound'),
      'task.notFound',
      'task'
    );
  }

  if (!(foundTask.creator !== context.userId)) {
    throw new UnauthorizedError(
      requestContext.translate('user.notAuthorized'),
      'user.notAuthorized',
      'userAuthorization'
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
