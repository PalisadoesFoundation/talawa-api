const User = require('../../models/User');
const Event = require('../../models/Event');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

module.exports = async (parent, args, context) => {
  //find event
  let event = await Event.findOne({ _id: args.eventId });
  if (!event) {
    throw new NotFoundError(
      requestContext.translate('event.notFound'),
      'event.notFound',
      'event'
    );
  }

  //gets user in token - to be used later on
  let user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  //remove event from user
  user.overwrite({
    ...user._doc,
    eventAdmin: user._doc.eventAdmin.filter(
      (eventAdmin) => eventAdmin !== event.id
    ),
    createdEvents: user._doc.createdEvents.filter(
      (createdEvent) => createdEvent !== event.id
    ),
    registeredEvents: user._doc.registeredEvents.filter(
      (registeredEvent) => registeredEvent !== event.id
    ),
  });

  await user.save();

  //delete post
  await Event.deleteOne({ _id: args.eventId });

  //return user
  return {
    ...event._doc,
  };
};
