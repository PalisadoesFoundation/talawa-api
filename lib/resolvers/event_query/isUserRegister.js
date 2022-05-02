const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  IN_PRODUCTION,
  EVENT_NOT_FOUND,
  EVENT_NOT_FOUND_CODE,
  EVENT_NOT_FOUND_MESSAGE,
  EVENT_NOT_FOUND_PARAM,
} = require('../../../constants');
const Event = require('../../models/Event');

module.exports = async (parent, args, context) => {
  const eventFound = await Event.findOne({
    _id: args.eventId,
    status: 'ACTIVE',
  })
    .populate('creator', '-password')
    .populate('tasks')
    .populate('admins', '-password');

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

  return {
    event: eventFound,
    isRegistered: isRegistered,
  };
};
