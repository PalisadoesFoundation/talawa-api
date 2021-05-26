const User = require('../../models/User');
const EventProject = require('../../models/EventProject');

const authCheck = require('../functions/authCheck');
const { NotFound, Unauthorized } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');

const removeEventProject = async (parent, args, context) => {
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

  if (!(eventProject.creator !== context.userId)) {
    throw new Unauthorized([
      {
        message: requestContext.translate('user.notAuthorized'),
        code: 'user.notAuthorized',
        param: 'userAuthorization',
      },
    ]);
  }

  await EventProject.deleteOne({ _id: args.id });
  return eventProject;
};

module.exports = removeEventProject;
