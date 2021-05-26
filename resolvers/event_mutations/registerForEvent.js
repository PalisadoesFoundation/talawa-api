const User = require('../../models/User');
const Event = require('../../models/Event');
const { NotFound } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');
const authCheck = require('../functions/authCheck');

const registerForEvent = async (parent, args, context) => {
  // authentication check
  authCheck(context);
  // gets user in token - to be used later on
  const userFound = await User.findOne({ _id: context.userId });
  if (!userFound) {
    throw new NotFound([
      {
        message: requestContext.translate('user.notFound'),
        code: 'user.notFound',
        param: 'user',
      },
    ]);
  }

  const eventFound = await Event.findOne({ _id: args.id });
  if (!eventFound) {
    throw new NotFound([
      {
        message: requestContext.translate('event.notFound'),
        code: 'event.notFound',
        param: 'event',
      },
    ]);
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
        registrants: userFound,
      },
    },
    { new: true }
  );

  return newEvent;
};

module.exports = registerForEvent;
