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
    throw new NotFound([
      {
        message: requestContext.translate('user.notFound'),
        code: 'user.notFound',
        param: 'user',
      },
    ]);
  }

  const foundTask = await Task.findOne({ _id: args.id });
  if (!foundTask) {
    throw new NotFound([
      {
        message: requestContext.translate('task.notFound'),
        code: 'task.notFound',
        param: 'task',
      },
    ]);
  }

  if (!(foundTask.creator !== context.userId)) {
    throw new Unauthorized([
      {
        message: requestContext.translate('user.notAuthorized'),
        code: 'user.notAuthorized',
        param: 'userAuthorization',
      },
    ]);
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
