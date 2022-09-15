const User = require('../../models/User');
const Organization = require('../../models/Organization');
// const Event = require('../../models/Event');
const { tenantCtx } = require('../../helper_functions');
const adminCheck = require('../functions/adminCheck');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

module.exports = async (parent, args, context) => {
  const { id: eventId, db } = await tenantCtx(args.eventId);
  //find event
  const { Event } = db;
  let event = await Event.findOne({ _id: eventId });
  if (!event) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
        ? 'Event not found'
        : requestContext.translate('event.notFound'),
      'event.notFound',
      'event'
    );
  }

  //ensure organization exists
  let org = await Organization.findOne({ _id: event.organization });
  if (!org) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
        ? 'Organization not found'
        : requestContext.translate('organization.notFound'),
      'organization.notFound',
      'organization'
    );
  }

  //gets user in token - to be used later on
  let user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
        ? 'User not found'
        : requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  //ensure user is an admin
  adminCheck(context, org);

  //remove event from user
  user.overwrite({
    ...user._doc,
    eventAdmin: user._doc.eventAdmin.filter(
      (eventAdmin) => eventAdmin !== args.eventId
    ),
    createdEvents: user._doc.createdEvents.filter(
      (createdEvent) => createdEvent !== args.eventId
    ),
    registeredEvents: user._doc.registeredEvents.filter(
      (registeredEvent) => registeredEvent !== args.eventId
    ),
  });

  await user.save();

  //delete post
  await Event.deleteOne({ _id: eventId });

  event._doc._id = args.eventId;
  //return user
  return {
    ...event._doc,
  };
};
