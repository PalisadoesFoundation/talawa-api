const User = require('../../models/User');
const Organization = require('../../models/Organization');
const Event = require('../../models/Event');
const adminCheck = require('../functions/adminCheck');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  NOT_FOUND_ORGANIZATION_CODE,
  NOT_FOUND_ORGANIZATION_PARAM,
  NOT_FOUND_ORGANIZATION_MESSAGE,
  NOT_FOUND_EVENT_CODE,
  NOT_FOUND_EVENT_PARAM,
  NOT_FOUND_EVENT_MESSAGE,
  NOT_FOUND_USER_CODE,
  NOT_FOUND_USER_PARAM,
  NOT_FOUND_USER_MESSAGE,
} = require('../../../constants');

module.exports = async (parent, args, context) => {
  //find event
  let event = await Event.findOne({ _id: args.eventId });
  if (!event) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_EVENT_MESSAGE),
      NOT_FOUND_EVENT_CODE,
      NOT_FOUND_EVENT_PARAM
    );
  }

  //ensure organization exists
  let org = await Organization.findOne({ _id: event.organization });
  if (!org) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_ORGANIZATION_MESSAGE),
      NOT_FOUND_ORGANIZATION_CODE,
      NOT_FOUND_ORGANIZATION_PARAM
    );
  }

  //gets user in token - to be used later on
  let user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_USER_MESSAGE),
      NOT_FOUND_USER_CODE,
      NOT_FOUND_USER_PARAM
    );
  }

  //ensure user is an admin
  adminCheck(context, org);

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
