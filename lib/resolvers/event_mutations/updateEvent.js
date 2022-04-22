const User = require('../../models/User');
const Event = require('../../models/Event');
const { NotFoundError, UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');

const updateEvent = async (parent, args, context) => {
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
        ? 'User not found'
        : requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  const event = await Event.findOne({ _id: args.id });
  if (!event) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
        ? 'Event not found'
        : requestContext.translate('event.notFound'),
      'event.notFound',
      'event'
    );
  }

  if (!event.admins.includes(context.userId)) {
    throw new UnauthorizedError(
      process.env.NODE_ENV !== 'production'
        ? 'User is not authorized for performing this operation'
        : requestContext.translate('user.notAuthorized'),
      'user.notAuthorized',
      'userAuthorization'
    );
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
