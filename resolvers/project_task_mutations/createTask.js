const User = require('../../models/User');
const Task = require('../../models/Task');
const Event = require('../../models/Event');
const { NotFound } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');
const authCheck = require('../functions/authCheck');

const createTask = async (parent, args, context) => {
  authCheck(context);

  // gets user in token - to be used later on
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFound(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  const eventFound = await Event.findOne({
    _id: args.eventId,
  });
  if (!eventFound) {
    throw new NotFound(
      requestContext.translate('event.notFound'),
      'event.notFound',
      'event'
    );
  }

  const task = new Task({
    ...args.data,
    event: eventFound,
    creator: user,
  });
  await task.save();

  await Event.findOneAndUpdate(
    { _id: args.eventId },
    {
      $push: {
        tasks: task,
      },
    },
    { new: true }
  );
  return {
    ...task._doc,
  };
};

module.exports = createTask;
