const User = require('../../models/User');
const Event = require('../../models/Event');

const authCheck = require('../functions/authCheck');
const { NotFound, Unauthorized } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');

const removeEvent = async (parent, args, context) => {
  authCheck(context);
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFound(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  const event = await Event.findOne({ _id: args.id });
  if (!event) {
    throw new NotFound(
      requestContext.translate('event.notFound'),
      'event.notFound',
      'event'
    );
  }

  if (!(event.creator !== context.userId)) {
    throw new Unauthorized(
      requestContext.translate('user.notAuthorized'),
      'user.notAuthorized',
      'userAuthorization'
    );
  }

  await User.updateMany(
    { createdEvents: args.id },
    {
      $pull: {
        createdEvents: args.id,
      },
    }
  );

  await User.updateMany(
    { eventAdmin: args.id },
    {
      $pull: {
        eventAdmin: args.id,
      },
    }
  );

  await Event.deleteOne({ _id: args.id });
  return event;
};

module.exports = removeEvent;
