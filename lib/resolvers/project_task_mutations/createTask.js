const User = require('../../models/User');
// const Task = require('../../models/Task');
// const Event = require('../../models/Event');
const { tenantCtx, addTenantId } = require('../../helper_functions');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  EVENT_NOT_FOUND,
  EVENT_NOT_FOUND_MESSAGE,
  EVENT_NOT_FOUND_CODE,
  EVENT_NOT_FOUND_PARAM,
} = require('../../../constants');
const createTask = async (parent, args, context) => {
  const { id: eventId, db, tenantId } = await tenantCtx(args.eventId);
  const { Event, Task } = db;
  // gets user in token - to be used later on
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  const eventFound = await Event.findOne({
    _id: eventId,
  });
  if (!eventFound) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? EVENT_NOT_FOUND
        : requestContext.translate(EVENT_NOT_FOUND_MESSAGE),
      EVENT_NOT_FOUND_CODE,
      EVENT_NOT_FOUND_PARAM
    );
  }

  const task = new Task({
    ...args.data,
    event: eventFound._id,
    creator: user._id,
  });
  await task.save();

  await Event.findOneAndUpdate(
    { _id: eventId },
    {
      $push: {
        tasks: task._id,
      },
    },
    { new: true }
  );
  task._doc._id = addTenantId(task._id, tenantId);
  await User.updateOne(
    { _id: user.id },
    {
      $push: {
        createdTasks: task._doc._id,
      },
    }
  );
  return {
    ...task._doc,
  };
};

module.exports = createTask;
