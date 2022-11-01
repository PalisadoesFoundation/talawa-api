const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  IN_PRODUCTION,
  EVENT_NOT_FOUND,
  EVENT_NOT_FOUND_CODE,
  EVENT_NOT_FOUND_MESSAGE,
  EVENT_NOT_FOUND_PARAM,
} = require('../../../constants');
const User = require('../../models/User');
const { tenantCtx } = require('../../helper_functions');

module.exports = async (parent, args, context) => {
  const { id: eventId, db } = await tenantCtx(args.eventId);
  const { Event, Task } = db;
  const eventFound = await Event.findOne({
    _id: eventId,
    status: 'ACTIVE',
  })
    .populate('creator', '-password', User)
    .populate('tasks', '', Task)
    .populate('admins', '-password', User);

  if (!eventFound) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? EVENT_NOT_FOUND
        : requestContext.translate(EVENT_NOT_FOUND_MESSAGE),
      EVENT_NOT_FOUND_CODE,
      EVENT_NOT_FOUND_PARAM
    );
  }

  let isRegistered = false;
  for (const registrant of eventFound.registrants) {
    if (
      registrant.userId === context.userId &&
      registrant.status === 'ACTIVE'
    ) {
      isRegistered = true;
      break;
    }
  }

  eventFound._doc._id = args.eventId;
  return {
    event: eventFound,
    isRegistered: isRegistered,
  };
};
