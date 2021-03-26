const User = require('../../models/User');
const Event = require('../../models/Event');

const authCheck = require('../functions/authCheck');

const updateEvent = async (parent, args, context) => {
  authCheck(context);
  const user = await User.findOne({ _id: context.userId });
  if (!user) throw new Error('User does not exist');

  const event = await Event.findOne({ _id: args.id });
  if (!event) throw new Error('Event not found');

  if (!event.admins.includes(context.userId)) {
    throw new Error("User cannot delete event they didn't create");
  }

  const newEvent = await Event.findOneAndUpdate(
    { _id: args.id },
    { ...args.data },
    { new: true }
  );
  return {
    ...newEvent._doc,
  };
};

module.exports = updateEvent;
