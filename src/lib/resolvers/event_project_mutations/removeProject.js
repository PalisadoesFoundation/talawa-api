const { User, EventProject } = require('../../models');
const constants = require('../../../constants');
const { NotFoundError, UnauthorizedError } = require('../../helper_lib/errors');
const requestContext = require('../../helper_lib/request-context');

const removeEventProject = async (parent, args, context) => {
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      !constants.IN_PRODUCTION
        ? constants.USER_NOT_FOUND
        : requestContext.translate(constants.USER_NOT_FOUND_MESSAGE),
      constants.USER_NOT_FOUND_CODE,
      constants.USER_NOT_FOUND_PARAM
    );
  }

  const eventProject = await EventProject.findOne({ _id: args.id });
  if (!eventProject) {
    throw new NotFoundError(
      !constants.IN_PRODUCTION
        ? constants.EVENT_PROJECT_NOT_FOUND
        : requestContext.translate(constants.EVENT_PROJECT_NOT_FOUND_MESSAGE),
      constants.EVENT_PROJECT_NOT_FOUND_CODE,
      constants.EVENT_PROJECT_NOT_FOUND_PARAM
    );
  }
  if (`${eventProject.creator}` !== `${context.userId}`) {
    throw new UnauthorizedError(
      !constants.IN_PRODUCTION
        ? constants.USER_NOT_AUTHORIZED
        : requestContext.translate(constants.USER_NOT_AUTHORIZED_MESSAGE),
      constants.USER_NOT_AUTHORIZED_CODE,
      constants.USER_NOT_AUTHORIZED_PARAM
    );
  }

  await EventProject.deleteOne({ _id: args.id });
  return eventProject;
};

module.exports = removeEventProject;
