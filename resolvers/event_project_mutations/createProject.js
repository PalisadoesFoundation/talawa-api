const User = require('../../models/User');
const EventProject = require('../../models/EventProject');
const Event = require('../../models/Event');
const { NotFound, Unauthorized } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');
const authCheck = require('../functions/authCheck');

const createEventProject = async (parent, args, context) => {
  // authentication check
  authCheck(context);

  // gets user in token - to be used later on
  const userFound = await User.findOne({ _id: context.userId });
  if (!userFound) {
    throw new NotFound(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  const eventFound = await Event.findOne({ _id: args.data.eventId });
  if (!eventFound) {
    throw new NotFound(
      requestContext.translate('event.notFound'),
      'event.notFound',
      'event'
    );
  }

  if (!eventFound.admins.includes(context.userId)) {
    throw new Unauthorized(
      requestContext.translate('user.notAuthorized'),
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
