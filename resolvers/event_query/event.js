const { NotFoundError } = require('errors');
const logger = require('logger');
const requestContext = require('talawa-request-context');

const Event = require('../../models/Event');

module.exports = async (parent, args, context) => {
  const eventFound = await Event.findOne({ _id: args.id })
    // .populate("registrants")
    .populate('creator', '-password')
    .populate('tasks')
    .populate('admins', '-password');
  if (!eventFound) {
    throw new NotFoundError(
      requestContext.translate('event.notFound'),
      'event.notFound',
      'event'
    );
  }
  eventFound.isRegistered = false;
  if (eventFound.registrants.includes(context.userId)) {
    eventFound.isRegistered = true;
  }
  logger.info(eventFound.isRegistered);
  return eventFound;
};
