const User = require('../../models/User');
const Event = require('../../models/Event');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const registerForEvent = async (parent, args, context) => {
  // gets user in token - to be used later on
  const userFound = await User.findOne({ _id: context.userId });
  if (!userFound) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  const eventFound = await Event.findOne({ _id: args.id });
  if (!eventFound) {
    throw new NotFoundError(
      requestContext.translate('event.notFound'),
      'event.notFound',
      'event'
    );
  }

  // add event to the user record
  await User.findOneAndUpdate(
    { _id: userFound.id },
    {
      $push: {
        registeredEvents: eventFound,
      },
    }
  );

  const newEvent = await Event.findOneAndUpdate(
    { _id: args.id },
    {
      $push: {
        registrants: {
          userId: userFound.id,
          user: userFound,
        },
      },
    },
    { new: true }
  );

  return newEvent;
};

module.exports = registerForEvent;
