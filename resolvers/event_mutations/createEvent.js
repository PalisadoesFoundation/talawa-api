const User = require('../../models/User');
const Event = require('../../models/Event');
const Organization = require('../../models/Organization');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const createEvent = async (parent, args, context) => {
  // gets user in token - to be used later on
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('event.notFound'),
      'user.notFound',
      'user'
    );
  }

  // ensure organization exists
  const org = await Organization.findOne({ _id: args.data.organizationId });
  if (!org) {
    throw new NotFoundError(
      requestContext.translate('chat.notFound'),
      'chat.notFound',
      'chat'
    );
  }

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
    { _id: user.id },
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
