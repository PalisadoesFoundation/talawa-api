const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
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
      requestContext.translate('event.notFound'),
      'event.notFound',
      'event'
    );
  }

  let isRegistered = false;
  eventFound.registrants.forEach((registrant) => {
    if (registrant.userId === context.userId) {
      isRegistered = true;
    }
  });

  return {
    event: eventFound,
    isRegistered: isRegistered,
  };
};
