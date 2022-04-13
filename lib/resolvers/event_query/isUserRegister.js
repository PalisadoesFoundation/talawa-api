const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const Event = require('../../models/Event');
const {
  NOT_FOUND_EVENT_MESSAGE,
  NOT_FOUND_EVENT_CODE,
  NOT_FOUND_EVENT_PARAM,
} = require('../../../constants');

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
      requestContext.translate(NOT_FOUND_EVENT_MESSAGE),
      NOT_FOUND_EVENT_CODE,
      NOT_FOUND_EVENT_PARAM
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
