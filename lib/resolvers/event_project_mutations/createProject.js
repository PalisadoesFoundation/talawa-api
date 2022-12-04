const User = require('../../models/User');
const { tenantCtx } = require('../../helper_functions');
const { NotFoundError, UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');

const createEventProject = async (parent, args, context) => {
  // gets user in token - to be used later on
  const userFound = await User.findOne({ _id: context.userId });
  if (!userFound) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
        ? 'User not found'
        : requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }
  const { id, db } = await tenantCtx(args.data.eventId);
  const { EventProject, Event } = db;

  const eventFound = await Event.findOne({ _id: id });
  if (!eventFound) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
        ? 'Event not found'
        : requestContext.translate('event.notFound'),
      'event.notFound',
      'event'
    );
  }

  if (!eventFound.admins.includes(context.userId)) {
    throw new UnauthorizedError(
      process.env.NODE_ENV !== 'production'
        ? 'User not Authorized'
        : requestContext.translate('user.notAuthorized'),
      'user.notAuthorized',
      'userAuthorization'
    );
  }

  const newEventProject = new EventProject({
    title: args.data.title,
    description: args.data.description,
    event: eventFound,
    creator: userFound,
  });

  await newEventProject.save();

  return {
    ...newEventProject._doc,
  };
};

module.exports = createEventProject;
