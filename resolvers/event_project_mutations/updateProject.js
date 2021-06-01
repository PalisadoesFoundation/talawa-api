const User = require('../../models/User');
const EventProject = require('../../models/EventProject');

const authCheck = require('../functions/authCheck');
const { NotFoundError, UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');

const updateEvent = async (parent, args, context) => {
  authCheck(context);
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  const eventProject = await EventProject.findOne({ _id: args.id });
  if (!eventProject) {
    throw new NotFoundError(
      requestContext.translate('eventProject.notFound'),
      'eventProject.notFound',
      'eventProject'
    );
  }

  if (!(eventProject.creator !== context.userId)) {
    throw new UnauthorizedError(
      requestContext.translate('user.notAuthorized'),
      'user.notAuthorized',
      'userAuthorization'
    );
  }

  const newEventProject = await EventProject.findOneAndUpdate(
    { _id: args.id },
    { ...args.data },
    { new: true }
  );
  return newEventProject;
};

module.exports = updateEvent;
