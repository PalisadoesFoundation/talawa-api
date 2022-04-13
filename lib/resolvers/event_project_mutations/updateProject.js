const User = require('../../models/User');
const EventProject = require('../../models/EventProject');

const { NotFoundError, UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');

const {
  NOT_FOUND_EVENT_PROJECT_CODE,
  NOT_FOUND_EVENT_PROJECT_MESSAGE,
  NOT_FOUND_EVENT_PROJECT_PARAM,
  NOT_FOUND_EVENT_PROJECT_TEST,
  NOT_FOUND_USER_CODE,
  NOT_FOUND_USER_MESSAGE,
  NOT_FOUND_USER_PARAM,
  NOT_FOUND_USER_TEST,
  NOT_AUTHORIZED_USER_CODE,
  NOT_AUTHORIZED_USER_MESSAGE,
  NOT_AUTHORIZED_USER_PARAM,
  NOT_AUTHORIZED_USER_TEST,
} = require('../../../constants');

const updateEvent = async (parent, args, context) => {
  const user = await User.findOne({ _id: context.userId });

  if (!user) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
        ? NOT_FOUND_USER_TEST
        : requestContext.translate(NOT_FOUND_USER_MESSAGE),
      NOT_FOUND_USER_CODE,
      NOT_FOUND_USER_PARAM
    );
  }

  const eventProject = await EventProject.findOne({ _id: args.id });

  if (!eventProject) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
        ? NOT_FOUND_EVENT_PROJECT_TEST
        : requestContext.translate(NOT_FOUND_EVENT_PROJECT_MESSAGE),
      NOT_FOUND_EVENT_PROJECT_CODE,
      NOT_FOUND_EVENT_PROJECT_PARAM
    );
  }

  // toString() method converts mongodb's objectId to a javascript string for comparision
  if (eventProject.creator.toString() !== context.userId) {
    throw new UnauthorizedError(
      process.env.NODE_ENV !== 'production'
        ? NOT_AUTHORIZED_USER_TEST
        : requestContext.translate(NOT_AUTHORIZED_USER_MESSAGE),
      NOT_AUTHORIZED_USER_CODE,
      NOT_AUTHORIZED_USER_PARAM
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
