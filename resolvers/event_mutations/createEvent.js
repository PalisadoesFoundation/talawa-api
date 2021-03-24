const User = require('../../models/User');
const Event = require('../../models/Event');
const Organization = require('../../models/Organization');
const authCheck = require('../functions/authCheck');

const createEvent = async (parent, args, context) => {
  // authentication check
  authCheck(context);

  // gets user in token - to be used later on
  const userFound = await User.findOne({ _id: context.userId });
  if (!userFound) {
    throw new Error('User does not exist');
  }

  // ensure organization exists
  const org = await Organization.findOne({ _id: args.data.organizationId });
  if (!org) throw new Error('Organization not found');

  const newEvent = new Event({
    ...args.data,
    creator: context.userId,
    registrants: [context.userId],
    admins: [context.userId],
    organization: args.data.organizationId,
  });
  await newEvent.save();

  // add event to the user record
  await User.updateOne(
    { _id: userFound.id },
    {
      $push: {
        eventAdmin: newEvent,
        createdEvents: newEvent,
        registeredEvents: newEvent,
      },
    }
  );

  return {
    ...newEvent._doc,
  };
};

module.exports = createEvent;
