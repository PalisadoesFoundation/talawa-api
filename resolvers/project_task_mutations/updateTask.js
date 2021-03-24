const User = require('../../models/User');
const Task = require('../../models/Task');

const authCheck = require('../functions/authCheck');

const updateTask = async (parent, args, context) => {
  authCheck(context);
  const user = await User.findOne({ _id: context.userId });
  if (!user) throw new Error('User does not exist');

  const task = await Task.findOne({ _id: args.id });
  if (!task) throw new Error('Task not found');

  if (!(task.creator !== context.userId)) {
    throw new Error("User cannot delete task they didn't create");
  }

  const newTask = await Task.findOneAndUpdate(
    { _id: args.id },
    { ...args.data },
    { new: true }
  );
  return newTask;
};

module.exports = updateTask;
