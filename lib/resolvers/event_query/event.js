const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const User = require('../../models/User');
const { tenantCtx } = require('../../helper_functions');

module.exports = async (parent, args) => {
  const { id: eventId, db } = await tenantCtx(args.id);
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
      requestContext.translate('event.notFound'),
      'event.notFound',
      'event'
    );
  }
  eventFound._doc._id = args.id;
  return eventFound;
};
