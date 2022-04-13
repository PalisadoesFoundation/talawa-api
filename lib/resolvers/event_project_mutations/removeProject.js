const User = require('../../models/User');
const EventProject = require('../../models/EventProject');

const { NotFoundError, UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  NOT_FOUND_EVENT_PROJECT_CODE,
  NOT_FOUND_EVENT_PROJECT_MESSAGE,
  NOT_FOUND_EVENT_PROJECT_PARAM,
  NOT_FOUND_USER_CODE,
  NOT_FOUND_USER_MESSAGE,
  NOT_FOUND_USER_PARAM,
  NOT_AUTHORIZED_USER_CODE,
  NOT_AUTHORIZED_USER_MESSAGE,
  NOT_AUTHORIZED_USER_PARAM,
} = require('../../../constants');

const removeEventProject = async (parent, args, context) => {
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_USER_MESSAGE),
      NOT_FOUND_USER_CODE,
      NOT_FOUND_USER_PARAM
    );
  }

  const eventProject = await EventProject.findOne({ _id: args.id });
  if (!eventProject) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_EVENT_PROJECT_MESSAGE),
      NOT_FOUND_EVENT_PROJECT_CODE,
      NOT_FOUND_EVENT_PROJECT_PARAM
    );
  }

  if (!(eventProject.creator !== context.userId)) {
    throw new UnauthorizedError(
      requestContext.translate(NOT_AUTHORIZED_USER_MESSAGE),
      NOT_AUTHORIZED_USER_CODE,
      NOT_AUTHORIZED_USER_PARAM
    );
  }

  await EventProject.deleteOne({ _id: args.id });
  return eventProject;
};

module.exports = removeEventProject;
