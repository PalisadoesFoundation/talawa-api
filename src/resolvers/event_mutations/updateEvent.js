const User = require('../../models/User');
const Event = require('../../models/Event');
const { NotFoundError, UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');

const updateEvent = async (parent, args, context) => {
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  const event = await Event.findOne({ _id: args.id });
  if (!event) {
    throw new NotFoundError(
      requestContext.translate('event.notFound'),
      'event.notFound',
      'event'
    );
  }

  if (!event.admins.includes(context.userId)) {
    throw new UnauthorizedError(
      requestContext.translate('user.notAuthorized'),
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
