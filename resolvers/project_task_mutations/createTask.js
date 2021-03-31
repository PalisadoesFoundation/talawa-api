const User = require('../../models/User');
const Task = require('../../models/Task');
const Event = require('../../models/Event');

const createTask = async (parent, args, context) => {
  // authentication check
  if (!context.isAuth) throw new Error('User is not authenticated');
  // gets user in token - to be used later on
  const userFound = await User.findOne({ _id: context.userId });
  if (!userFound) {
    throw new Error('User does not exist');
  }

  const eventFound = await Event.findOne({
    _id: args.eventId,
  });
  if (!eventFound) {
    throw new Error('Event does not exist');
  }

  const task = new Task({
    ...args.data,
    event: eventFound,
    creator: userFound,
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
