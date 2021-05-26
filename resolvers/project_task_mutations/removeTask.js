const User = require('../../models/User');
const Event = require('../../models/Event');
const Task = require('../../models/Task');
const { NotFound, Unauthorized } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');

const authCheck = require('../functions/authCheck');

const removeTask = async (parent, args, context) => {
  authCheck(context);
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFound(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  const foundTask = await Task.findOne({ _id: args.id });
  if (!foundTask) {
    throw new NotFound(
      requestContext.translate('task.notFound'),
      'task.notFound',
      'task'
    );
  }

  if (!(foundTask.creator !== context.userId)) {
    throw new Unauthorized(
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
