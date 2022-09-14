const User = require('../../models/User');
// const Event = require('../../models/Event');
const { tenantCtx } = require('../../helper_functions/');
const { NotFoundError, UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  EVENT_NOT_FOUND,
  EVENT_NOT_FOUND_MESSAGE,
  EVENT_NOT_FOUND_CODE,
  EVENT_NOT_FOUND_PARAM,
  USER_NOT_AUTHORIZED,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_PARAM,
} = require('../../../constants');

const removeEvent = async (parent, args, context) => {
  const { id, db } = await tenantCtx(args.id);
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  const { Event } = db;
  const event = await Event.findOne({ _id: id });
  if (!event) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? EVENT_NOT_FOUND
        : requestContext.translate(EVENT_NOT_FOUND_MESSAGE),
      EVENT_NOT_FOUND_CODE,
      EVENT_NOT_FOUND_PARAM
    );
  }
  const isUserOrganisationAdmin = user.adminFor.includes(
    event.organization.toString()
  );

  const isUserEventAdmin = event.admins.includes(context.userId.toString());
  const userCanDeleteThisEvent = isUserOrganisationAdmin || isUserEventAdmin;

  if (!userCanDeleteThisEvent) {
    throw new UnauthorizedError(
      !IN_PRODUCTION
        ? USER_NOT_AUTHORIZED
        : requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
      USER_NOT_AUTHORIZED_CODE,
      USER_NOT_AUTHORIZED_PARAM
    );
  }

  await User.updateMany(
    { createdEvents: id },
    {
      $pull: {
        createdEvents: args.id,
      },
    }
  );

  await User.updateMany(
    { eventAdmin: id },
    {
      $pull: {
        eventAdmin: args.id,
      },
    }
  );

  await Event.findOneAndUpdate({ _id: id }, { status: 'DELETED' });
  event._doc._id = args.id;
  return event;
};

module.exports = removeEvent;
