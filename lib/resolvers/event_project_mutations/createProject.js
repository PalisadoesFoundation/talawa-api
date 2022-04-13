const User = require('../../models/User');
const EventProject = require('../../models/EventProject');
const Event = require('../../models/Event');
const { NotFoundError, UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  NOT_FOUND_EVENT_CODE,
  NOT_FOUND_EVENT_MESSAGE,
  NOT_FOUND_EVENT_PARAM,
  NOT_FOUND_EVENT_TEST,
  NOT_FOUND_USER_CODE,
  NOT_FOUND_USER_TEST,
  NOT_FOUND_USER_MESSAGE,
  NOT_FOUND_USER_PARAM,
  NOT_AUTHORIZED_USER_CODE,
  NOT_AUTHORIZED_USER_MESSAGE,
  NOT_AUTHORIZED_USER_PARAM,
  NOT_AUTHORIZED_USER_TEST,
} = require('../../../constants');

const createEventProject = async (parent, args, context) => {
  // gets user in token - to be used later on
  const userFound = await User.findOne({ _id: context.userId });
  if (!userFound) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
        ? NOT_FOUND_USER_TEST
        : requestContext.translate(NOT_FOUND_USER_MESSAGE),
      NOT_FOUND_USER_CODE,
      NOT_FOUND_USER_PARAM
    );
  }

  const eventFound = await Event.findOne({ _id: args.data.eventId });
  if (!eventFound) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
        ? NOT_FOUND_EVENT_TEST
        : requestContext.translate(NOT_FOUND_EVENT_MESSAGE),
      NOT_FOUND_EVENT_CODE,
      NOT_FOUND_EVENT_PARAM
    );
  }

  if (!eventFound.admins.includes(context.userId)) {
    throw new UnauthorizedError(
      process.env.NODE_ENV !== 'production'
        ? NOT_AUTHORIZED_USER_TEST
        : requestContext.translate(NOT_AUTHORIZED_USER_MESSAGE),
      NOT_AUTHORIZED_USER_CODE,
      NOT_AUTHORIZED_USER_PARAM
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
