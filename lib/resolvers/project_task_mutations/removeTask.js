const User = require('../../models/User');
const { tenantCtx } = require('../../helper_functions');
const { NotFoundError, UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');

const removeTask = async (parent, args, context) => {
  const { id, db } = await tenantCtx(args.id);
  const { Event, Task } = db;
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  const foundTask = await Task.findOne({ _id: id });
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
        tasks: id,
      },
    }
  );

  await Task.deleteOne({ _id: id });
  foundTask._doc._id = args.id;
  return foundTask;
};

module.exports = removeTask;
