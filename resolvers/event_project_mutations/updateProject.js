const User = require('../../models/User');
const EventProject = require('../../models/EventProject');

const authCheck = require('../functions/authCheck');
const { NotFound, Unauthorized } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');

const updateEvent = async (parent, args, context) => {
  authCheck(context);
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFound([
      {
        message: requestContext.translate('user.notFound'),
        code: 'user.notFound',
        param: 'user',
      },
    ]);
  }

  const eventProject = await EventProject.findOne({ _id: args.id });
  if (!eventProject) {
    throw new NotFound([
      {
        message: requestContext.translate('eventProject.notFound'),
        code: 'eventProject.notFound',
        param: 'eventProject',
      },
    ]);
  }

  console.log(eventProject.creator !== context.userId);

  if (!(eventProject.creator !== context.userId)) {
    throw new Unauthorized([
      {
        message: requestContext.translate('user.notAuthorized'),
        code: 'user.notAuthorized',
        param: 'userAuthorization',
      },
    ]);
  }

  const newEventProject = await EventProject.findOneAndUpdate(
    { _id: args.id },
    { ...args.data },
    { new: true }
  );
  return newEventProject;
};

module.exports = updateEvent;
