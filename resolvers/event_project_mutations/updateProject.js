const User = require('../../models/User');
const EventProject = require('../../models/EventProject');

const authCheck = require('../functions/authCheck');
const { NotFound, Unauthorized } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');

const updateEvent = async (parent, args, context) => {
  authCheck(context);
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFound(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  const eventProject = await EventProject.findOne({ _id: args.id });
  if (!eventProject) {
    throw new NotFound(
      requestContext.translate('eventProject.notFound'),
      'eventProject.notFound',
      'eventProject'
    );
  }

  console.log(eventProject.creator !== context.userId);

  if (!(eventProject.creator !== context.userId)) {
    throw new Unauthorized(
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
